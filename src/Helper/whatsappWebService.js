const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const WhatsAppSession = require('../models/WhatsAppSession');

// Map of sessionId -> runtime session state { client, qrCode, status, user, isInitializing }
const sessions = new Map();
let ioInstance = null;

const { execSync } = require('child_process');

/**
 * Auto-detect available Google Chrome or Chromium binary path
 */
const getChromeExecutablePath = () => {
    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    // Try finding via 'which' command on Linux / macOS
    try {
        const whichOutput = execSync('which google-chrome-stable || which google-chrome || which chromium-browser || which chromium', {
            stdio: ['pipe', 'pipe', 'ignore'],
            encoding: 'utf-8'
        }).trim();
        if (whichOutput && fs.existsSync(whichOutput)) {
            console.log(`🔍 Found Chrome via system PATH at: ${whichOutput}`);
            return whichOutput;
        }
    } catch (e) {
        // ignore
    }

    const possiblePaths = [
        // macOS
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        // Linux
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        '/opt/google/chrome/chrome',
        '/opt/google/chrome/google-chrome',
        '/usr/local/bin/chrome',
        '/usr/local/bin/chromium',
        // Windows
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log(`🔍 Auto-detected Chrome at: ${p}`);
            return p;
        }
    }

    return undefined;
};

/**
 * Remove stale Chromium profile lock files to prevent cross-machine SingletonLock crashes
 */
const cleanChromiumLocks = (sessionId) => {
    try {
        const sessionDir = path.join(process.cwd(), '.wwebjs_auth', `session-${sessionId}`);
        if (!fs.existsSync(sessionDir)) return;

        const filesToClean = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort'];
        
        const scanAndRemove = (dir) => {
            if (!fs.existsSync(dir)) return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name === 'Default' || entry.name === 'Profile 1') {
                        scanAndRemove(fullPath);
                    }
                } else if (filesToClean.includes(entry.name) || entry.name.startsWith('Singleton')) {
                    try {
                        fs.unlinkSync(fullPath);
                        console.log(`🧹 Removed stale Chromium lock file: ${fullPath}`);
                    } catch (e) {
                        // ignore
                    }
                }
            }
        };

        scanAndRemove(sessionDir);
    } catch (err) {
        console.error('Error cleaning Chromium lock files:', err);
    }
};

/**
 * Emit all sessions list to Socket.io clients
 */
const emitSessionsList = async () => {
    if (!ioInstance) return;
    try {
        const list = await getAllSessions();
        ioInstance.emit('whatsapp_sessions_list', list);
    } catch (err) {
        console.error('Error emitting sessions list:', err);
    }
};

/**
 * Start a specific WhatsApp Session Client
 */
const startSession = async (sessionId, label = 'WhatsApp Account', isActive = false) => {
    let sessionData = sessions.get(sessionId);

    if (sessionData && sessionData.client && sessionData.status === 'READY') {
        console.log(`Session [${sessionId}] is already READY`);
        return sessionData.client;
    }

    if (sessionData && sessionData.isInitializing) {
        console.log(`Session [${sessionId}] is already initializing`);
        return sessionData.client;
    }

    // Clean up previous client if exists
    if (sessionData && sessionData.client) {
        try {
            await sessionData.client.destroy();
        } catch (err) {
            console.error(`Error destroying old client for session [${sessionId}]:`, err);
        }
    }

    sessionData = {
        sessionId,
        label,
        client: null,
        qrCode: null,
        status: 'INITIALIZING',
        user: null,
        isActiveForOtp: isActive,
        isInitializing: true
    };
    sessions.set(sessionId, sessionData);

    await WhatsAppSession.findOneAndUpdate(
        { sessionId },
        { status: 'INITIALIZING', label },
        { upsert: true, new: true }
    );
    emitSessionsList();

    console.log(`🚀 Initializing WhatsApp Web Client for Session [${sessionId} - "${label}"]...`);

    try {
        cleanChromiumLocks(sessionId);
        const executablePath = getChromeExecutablePath();

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: sessionId,
                dataPath: '.wwebjs_auth'
            }),
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1018949823-alpha.html'
            },
            puppeteer: {
                headless: true,
                executablePath: executablePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        sessionData.client = client;

        // QR Event
        client.on('qr', async (qr) => {
            console.log(`⚡ QR Code Generated for Session [${sessionId}]`);
            sessionData.qrCode = qr;
            sessionData.status = 'QR_READY';
            sessionData.isInitializing = false;

            try {
                qrcodeTerminal.generate(qr, { small: true });
            } catch (e) {
                // ignore
            }

            await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'QR_READY' });

            if (ioInstance) {
                ioInstance.emit('whatsapp_session_qr', {
                    sessionId,
                    qr,
                    status: 'QR_READY'
                });
            }
            emitSessionsList();
        });

        // Authenticated Event
        client.on('authenticated', async () => {
            console.log(`✅ Session [${sessionId}] Authenticated successfully!`);
            sessionData.status = 'AUTHENTICATED';
            sessionData.qrCode = null;
            await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'AUTHENTICATED' });
            emitSessionsList();
        });

        // Auth Failure Event
        client.on('auth_failure', async (msg) => {
            console.error(`❌ Session [${sessionId}] Auth Failure:`, msg);
            sessionData.status = 'DISCONNECTED';
            sessionData.qrCode = null;
            sessionData.user = null;
            sessionData.isInitializing = false;
            await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'DISCONNECTED' });
            emitSessionsList();
        });

        // Ready Event
        client.on('ready', async () => {
            console.log(`🎉 Session [${sessionId} - "${label}"] is READY to send messages!`);
            sessionData.status = 'READY';
            sessionData.qrCode = null;
            sessionData.isInitializing = false;

            let userInfo = { phone: 'Connected', name: label, platform: 'whatsapp' };
            try {
                const info = client.info;
                userInfo = {
                    phone: info?.wid?.user || '',
                    name: info?.pushname || label,
                    platform: info?.platform || 'whatsapp'
                };
            } catch (err) {
                console.error(`Error reading client.info for session [${sessionId}]:`, err);
            }

            sessionData.user = userInfo;

            await WhatsAppSession.findOneAndUpdate(
                { sessionId },
                {
                    status: 'READY',
                    phoneNumber: userInfo.phone,
                    pushName: userInfo.name,
                    platform: userInfo.platform,
                    lastConnectedAt: new Date()
                }
            );

            if (ioInstance) {
                ioInstance.emit('whatsapp_session_ready', {
                    sessionId,
                    status: 'READY',
                    user: userInfo
                });
            }
            emitSessionsList();
        });

        // Disconnected Event
        client.on('disconnected', async (reason) => {
            console.log(`❌ Session [${sessionId}] Disconnected:`, reason);
            sessionData.status = 'DISCONNECTED';
            sessionData.qrCode = null;
            sessionData.user = null;
            sessionData.isInitializing = false;

            await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'DISCONNECTED' });

            if (ioInstance) {
                ioInstance.emit('whatsapp_session_disconnected', {
                    sessionId,
                    status: 'DISCONNECTED',
                    reason
                });
            }
            emitSessionsList();
        });

        client.initialize().catch(async (err) => {
            console.error(`❌ Session [${sessionId}] Initialization Error:`, err);
            sessionData.status = 'DISCONNECTED';
            sessionData.isInitializing = false;
            await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'DISCONNECTED' });
            emitSessionsList();
        });

    } catch (err) {
        console.error(`Failed to create client for session [${sessionId}]:`, err);
        sessionData.status = 'DISCONNECTED';
        sessionData.isInitializing = false;
        await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'DISCONNECTED' });
        emitSessionsList();
    }

    return sessionData.client;
};

/**
 * Initialize all saved WhatsApp sessions on server start
 */
const initAllSessions = async (io) => {
    if (io) {
        ioInstance = io;
    }

    try {
        let dbSessions = await WhatsAppSession.find();

        // If no session exists in DB yet, create a default Primary Account
        if (!dbSessions || dbSessions.length === 0) {
            console.log('No existing WhatsApp sessions found. Creating default Primary Account (account_1)...');
            const defaultSession = await WhatsAppSession.create({
                sessionId: 'account_1',
                label: 'Primary WhatsApp Account',
                isActiveForOtp: true,
                status: 'INITIALIZING'
            });
            dbSessions = [defaultSession];
        }

        // Start each session client
        for (const sess of dbSessions) {
            await startSession(sess.sessionId, sess.label, sess.isActiveForOtp);
        }

    } catch (error) {
        console.error('Error initializing WhatsApp sessions:', error);
    }
};

/**
 * Create a new WhatsApp session
 */
const createSession = async (label) => {
    const sessionId = `account_${Date.now()}`;
    const cleanLabel = (label && label.trim()) || `Account ${sessions.size + 1}`;

    // If it's the only session, set active for OTP by default
    const count = await WhatsAppSession.countDocuments();
    const isActive = count === 0;

    const newDbSession = await WhatsAppSession.create({
        sessionId,
        label: cleanLabel,
        isActiveForOtp: isActive,
        status: 'INITIALIZING'
    });

    await startSession(sessionId, cleanLabel, isActive);

    return newDbSession;
};

/**
 * Get all sessions list with DB & runtime state combined
 */
const getAllSessions = async () => {
    const dbSessions = await WhatsAppSession.find().sort({ createdAt: 1 });

    return dbSessions.map((dbSess) => {
        const runtime = sessions.get(dbSess.sessionId);
        return {
            _id: dbSess._id,
            sessionId: dbSess.sessionId,
            label: dbSess.label,
            phoneNumber: runtime?.user?.phone || dbSess.phoneNumber || '',
            pushName: runtime?.user?.name || dbSess.pushName || '',
            platform: runtime?.user?.platform || dbSess.platform || 'whatsapp',
            status: runtime?.status || dbSess.status || 'DISCONNECTED',
            qr: runtime?.qrCode || null,
            isActiveForOtp: dbSess.isActiveForOtp,
            isReady: (runtime?.status === 'READY') || (dbSess.status === 'READY' && runtime?.status !== 'DISCONNECTED'),
            lastConnectedAt: dbSess.lastConnectedAt,
            createdAt: dbSess.createdAt
        };
    });
};

/**
 * Set a specific session as active for OTP dispatch
 */
const setActiveSessionForOtp = async (sessionId) => {
    // Set all to false, then set target to true
    await WhatsAppSession.updateMany({}, { isActiveForOtp: false });
    const updated = await WhatsAppSession.findOneAndUpdate(
        { sessionId },
        { isActiveForOtp: true },
        { new: true }
    );

    // Update runtime map
    for (const [sId, sess] of sessions.entries()) {
        sess.isActiveForOtp = (sId === sessionId);
    }

    emitSessionsList();
    return updated;
};

/**
 * Restart / Regenerate QR for a session
 */
const restartSession = async (sessionId) => {
    const dbSess = await WhatsAppSession.findOne({ sessionId });
    if (!dbSess) {
        throw new Error(`Session ${sessionId} not found`);
    }

    const sessionData = sessions.get(sessionId);
    if (sessionData && sessionData.client) {
        try {
            await sessionData.client.destroy();
        } catch (err) {
            console.error(`Error destroying client for session ${sessionId}:`, err);
        }
    }
    sessions.delete(sessionId);

    return await startSession(sessionId, dbSess.label, dbSess.isActiveForOtp);
};

/**
 * Disconnect and log out a session
 */
const logoutSession = async (sessionId) => {
    const sessionData = sessions.get(sessionId);
    if (sessionData && sessionData.client) {
        try {
            if (sessionData.status === 'READY') {
                await sessionData.client.logout();
            }
            await sessionData.client.destroy();
        } catch (err) {
            console.error(`Error logging out session ${sessionId}:`, err);
        }
    }

    sessions.set(sessionId, {
        sessionId,
        label: sessionData?.label || 'WhatsApp Account',
        client: null,
        qrCode: null,
        status: 'DISCONNECTED',
        user: null,
        isActiveForOtp: sessionData?.isActiveForOtp || false,
        isInitializing: false
    });

    await WhatsAppSession.findOneAndUpdate({ sessionId }, { status: 'DISCONNECTED' });
    emitSessionsList();

    return { success: true, message: `Session ${sessionId} logged out successfully` };
};

/**
 * Delete a session permanently
 */
const deleteSession = async (sessionId) => {
    // Logout / destroy client first
    await logoutSession(sessionId);

    // Remove auth directory
    try {
        const authPath = path.join('.wwebjs_auth', `session-${sessionId}`);
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
        }
    } catch (err) {
        console.error(`Error deleting auth directory for session ${sessionId}:`, err);
    }

    sessions.delete(sessionId);
    await WhatsAppSession.deleteOne({ sessionId });

    // If deleted session was active, make another connected session active
    const remaining = await WhatsAppSession.find();
    if (remaining.length > 0 && !remaining.some(s => s.isActiveForOtp)) {
        await setActiveSessionForOtp(remaining[0].sessionId);
    }

    emitSessionsList();
    return { success: true, message: `Session ${sessionId} deleted successfully` };
};

/**
 * Format phone number to WhatsApp JID
 */
const formatPhoneNumber = (phone) => {
    let clean = String(phone).replace(/\D/g, '');
    if (clean.length === 10) {
        clean = `91${clean}`;
    }
    return `${clean}@c.us`;
};

/**
 * Send WhatsApp Message using a specific session
 */
const sendMessageFromSession = async (sessionId, phone, messageText) => {
    const sessionData = sessions.get(sessionId);
    if (!sessionData || !sessionData.client || sessionData.status !== 'READY') {
        throw new Error(`WhatsApp Session [${sessionId}] is not connected or ready.`);
    }

    const chatId = formatPhoneNumber(phone);
    console.log(`[Session: ${sessionId}] Sending WhatsApp message to ${chatId}...`);
    const res = await sessionData.client.sendMessage(chatId, messageText);
    console.log(`[Session: ${sessionId}] ✅ Message sent successfully!`);
    return res;
};

/**
 * Send WhatsApp OTP Message using the active session (or first ready session)
 */
const sendOtpMessage = async (phone, otp) => {
    // Find active session
    let activeSessionId = null;

    for (const [sId, sess] of sessions.entries()) {
        if (sess.isActiveForOtp && sess.status === 'READY') {
            activeSessionId = sId;
            break;
        }
    }

    // If active session not ready, find ANY ready session as fallback
    if (!activeSessionId) {
        for (const [sId, sess] of sessions.entries()) {
            if (sess.status === 'READY') {
                activeSessionId = sId;
                break;
            }
        }
    }

    if (!activeSessionId) {
        throw new Error('No WhatsApp account is currently connected & active for OTP.');
    }

    const messageText = `🔐 *Your Verification Code is:* *${otp}*\n\nPlease do not share this OTP with anyone. It is valid for 10 minutes.\n\n_Sent via Secure System_`;
    return await sendMessageFromSession(activeSessionId, phone, messageText);
};

/**
 * Check if ANY WhatsApp Web session is currently ready
 */
const hasActiveReadySession = () => {
    for (const [, sess] of sessions.entries()) {
        if (sess.status === 'READY') {
            return true;
        }
    }
    return false;
};

module.exports = {
    initAllSessions,
    createSession,
    getAllSessions,
    startSession,
    restartSession,
    logoutSession,
    deleteSession,
    setActiveSessionForOtp,
    sendMessageFromSession,
    sendOtpMessage,
    hasActiveReadySession,
    formatPhoneNumber
};

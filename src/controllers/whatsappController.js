const whatsappWebService = require('../Helper/whatsappWebService');

/**
 * Get all WhatsApp sessions with statuses
 */
const getSessions = async (req, res) => {
    try {
        const sessions = await whatsappWebService.getAllSessions();
        return res.status(200).json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Error fetching WhatsApp sessions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch WhatsApp sessions',
            error: error.message
        });
    }
};

/**
 * Create a new WhatsApp session
 */
const createSession = async (req, res) => {
    try {
        const { label } = req.body;
        const newSession = await whatsappWebService.createSession(label);
        return res.status(201).json({
            success: true,
            message: 'New WhatsApp session created successfully',
            data: newSession
        });
    } catch (error) {
        console.error('Error creating WhatsApp session:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create WhatsApp session',
            error: error.message
        });
    }
};

/**
 * Restart / Regenerate QR for a session
 */
const restartSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        await whatsappWebService.restartSession(sessionId);
        return res.status(200).json({
            success: true,
            message: `Session ${sessionId} restarted. QR generation in progress.`
        });
    } catch (error) {
        console.error('Error restarting session:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to restart session',
            error: error.message
        });
    }
};

/**
 * Disconnect a WhatsApp session
 */
const logoutSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await whatsappWebService.logoutSession(sessionId);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error logging out session:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to logout session',
            error: error.message
        });
    }
};

/**
 * Delete a WhatsApp session permanently
 */
const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await whatsappWebService.deleteSession(sessionId);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error deleting session:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete session',
            error: error.message
        });
    }
};

/**
 * Set a session as active sender for OTPs
 */
const setActiveSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const updated = await whatsappWebService.setActiveSessionForOtp(sessionId);
        return res.status(200).json({
            success: true,
            message: `Session ${sessionId} is now active for OTP dispatch`,
            data: updated
        });
    } catch (error) {
        console.error('Error setting active session:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to set active session',
            error: error.message
        });
    }
};

/**
 * Send test message from a specific session
 */
const sendTestMessage = async (req, res) => {
    try {
        const { sessionId, phoneNumber, message } = req.body;
        if (!sessionId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Session ID and Phone Number are required'
            });
        }

        const msgText = message || '👋 Hello! This is a test message from your Admin WhatsApp Integration.';
        await whatsappWebService.sendMessageFromSession(sessionId, phoneNumber, msgText);

        return res.status(200).json({
            success: true,
            message: `Test message sent successfully from session [${sessionId}] to ${phoneNumber}`
        });
    } catch (error) {
        console.error('Error sending test message:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to send WhatsApp message'
        });
    }
};

module.exports = {
    getSessions,
    createSession,
    restartSession,
    logoutSession,
    deleteSession,
    setActiveSession,
    sendTestMessage
};

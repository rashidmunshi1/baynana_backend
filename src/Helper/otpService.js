const sendTwilioOtp = require('./twilioService');
const sendWhatsappOtp = require('./whatsappService');
const whatsappWebService = require('./whatsappWebService');
require('dotenv').config();

const Setting = require('../models/Setting');

/**
 * Unified sendOtp service that selects the active OTP provider:
 * 1. Active Linked WhatsApp Web account (from Admin QR scan) if connected
 * 2. WhatsApp Cloud API / Meta API
 * 3. Twilio SMS
 * 
 * @param {string} phoneNumber - The phone number (with or without '+')
 * @param {string} otp - The generated 6-digit OTP code
 */
const sendOtp = async (phoneNumber, otp) => {
    // Priority 1: Check if any active WhatsApp Web session is connected
    const isWebReady = whatsappWebService.hasActiveReadySession();
    console.log(`[OTP] Checking WhatsApp Web session: isConnected=${isWebReady}`);

    if (isWebReady) {
        console.log(`[OTP] 🚀 Dispatching OTP via Linked WhatsApp Web account to ${phoneNumber}...`);
        try {
            return await whatsappWebService.sendOtpMessage(phoneNumber, otp);
        } catch (webErr) {
            console.error('[OTP] ❌ WhatsApp Web sending failed, trying fallback:', webErr.message);
        }
    } else {
        console.log(`[OTP] ℹ️ WhatsApp Web is not connected yet. Falling back to Meta Cloud API / Twilio.`);
    }

    // Priority 2: Fallback to Settings / Env Provider (Meta Cloud API or Twilio)
    let settings = await Setting.findOne();
    const provider = settings?.otpProvider || process.env.OTP_PROVIDER || 'whatsapp';

    if (provider.toLowerCase() === 'twilio') {
        let formattedNumber = phoneNumber;
        if (!formattedNumber.startsWith('+')) {
            formattedNumber = `+${formattedNumber}`;
        }
        return await sendTwilioOtp(formattedNumber, otp);
    } else {
        let formattedNumber = phoneNumber;
        if (formattedNumber.startsWith('+')) {
            formattedNumber = formattedNumber.slice(1);
        }
        return await sendWhatsappOtp(formattedNumber, otp);
    }
};

module.exports = sendOtp;

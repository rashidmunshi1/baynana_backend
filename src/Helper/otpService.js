const sendTwilioOtp = require('./twilioService');
const sendWhatsappOtp = require('./whatsappService');
require('dotenv').config();

const Setting = require('../models/Setting');

/**
 * Unified sendOtp service that selects the active OTP provider (WhatsApp or Twilio)
 * and formats the phone number appropriately.
 * 
 * @param {string} phoneNumber - The phone number (with or without '+')
 * @param {string} otp - The generated 6-digit OTP code
 */
const sendOtp = async (phoneNumber, otp) => {
    let settings = await Setting.findOne();
    const provider = settings?.otpProvider || process.env.OTP_PROVIDER || 'whatsapp';

    if (provider.toLowerCase() === 'twilio') {
        // Twilio expects a format like "+919876543210"
        let formattedNumber = phoneNumber;
        if (!formattedNumber.startsWith('+')) {
            formattedNumber = `+${formattedNumber}`;
        }
        return await sendTwilioOtp(formattedNumber, otp);
    } else {
        // WhatsApp Cloud API expects a format like "919876543210" (no "+")
        let formattedNumber = phoneNumber;
        if (formattedNumber.startsWith('+')) {
            formattedNumber = formattedNumber.slice(1);
        }
        return await sendWhatsappOtp(formattedNumber, otp);
    }
};

module.exports = sendOtp;

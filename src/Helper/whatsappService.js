const axios = require('axios');
require('dotenv').config();

/**
 * Sends a WhatsApp OTP template message using the Meta/Facebook Graph API.
 * 
 * @param {string} phoneNumber - The target recipient number
 * @param {string} otp - The generated 6-digit OTP code
 */
const sendWhatsappOtp = async (phoneNumber, otp) => {
    try {
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ? process.env.WHATSAPP_PHONE_NUMBER_ID.trim() : null;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ? process.env.WHATSAPP_ACCESS_TOKEN.trim() : null;
        const templateName = (process.env.WHATSAPP_TEMPLATE_NAME || 'otp_template').trim();
        const templateLang = (process.env.WHATSAPP_TEMPLATE_LANG || 'en_US').trim();

        if (!phoneNumberId || !accessToken) {
            console.error("WhatsApp credentials missing in environment configuration.");
            throw new Error("WhatsApp Service credentials not configured");
        }

        // WhatsApp expects country code and no leading "+" or spaces
        const cleanNumber = phoneNumber.replace(/\+/g, '').replace(/\s+/g, '');
        console.log(cleanNumber)

        const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };

        // Build body parameters dynamically
        // For OTP-only templates: WHATSAPP_TEMPLATE_PARAMS_COUNT=1 (default)
        // For templates like jaspers_market_order_confirmation_v1: WHATSAPP_TEMPLATE_PARAMS_COUNT=3
        const paramsCount = parseInt(process.env.WHATSAPP_TEMPLATE_PARAMS_COUNT || '1', 10);
        const bodyParams = [];
        for (let i = 0; i < paramsCount; i++) {
            bodyParams.push({ "type": "text", "text": otp });
        }

        const components = [
            {
                "type": "body",
                "parameters": bodyParams
            }
        ];

        if (process.env.WHATSAPP_TEMPLATE_HAS_BUTTON === 'true') {
            components.push({
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                    {
                        "type": "text",
                        "text": otp
                    }
                ]
            });
        }

        const data = {
            "messaging_product": "whatsapp",
            "to": cleanNumber,
            "type": "template",
            "template": {
                "name": templateName,
                "language": {
                    "code": templateLang
                },
                "components": components
            }
        };

        console.log(`Sending WhatsApp OTP to ${cleanNumber}. Requesting template "${templateName}" via Axios...`);

        const response = await axios.post(url, data, { headers });
        console.log("✅ OTP Successfully Sent!");
        return response.data;

    } catch (error) {
        console.error("❌ Error sending OTP:");
        if (error.response) {
            console.error("WhatsApp API Error Response:", error.response.data);
            throw new Error(error.response.data.error?.message || "Failed to send WhatsApp message");
        } else {
            console.error(error.message);
            throw error;
        }
    }
};

module.exports = sendWhatsappOtp;

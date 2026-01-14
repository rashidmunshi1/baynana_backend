require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendOtp = async (phoneNumber, otp) => {
    try {
        const message = await client.messages.create({
            body: `Your OTP is: ${otp}`,
            messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
            to: phoneNumber  
        });

        console.log("OTP SENT:", message.sid);
        return message;

    } catch (error) {
        console.error("OTP ERROR:", error.message);
        throw error;
    }
};

module.exports = sendOtp;

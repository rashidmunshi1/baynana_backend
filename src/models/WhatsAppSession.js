const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        label: {
            type: String,
            default: 'WhatsApp Account',
            trim: true
        },
        phoneNumber: {
            type: String,
            default: ''
        },
        pushName: {
            type: String,
            default: ''
        },
        platform: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['DISCONNECTED', 'INITIALIZING', 'QR_READY', 'AUTHENTICATED', 'READY'],
            default: 'DISCONNECTED'
        },
        isActiveForOtp: {
            type: Boolean,
            default: false
        },
        lastConnectedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('WhatsAppSession', whatsappSessionSchema);

const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
    {
        otpProvider: {
            type: String,
            default: "whatsapp",
            enum: ["whatsapp", "twilio"],
        },
        whatsappPhoneNumberId: {
            type: String,
            default: "",
        },
        whatsappAccessToken: {
            type: String,
            default: "",
        },
        whatsappTemplateName: {
            type: String,
            default: "",
        },
        whatsappTemplateLang: {
            type: String,
            default: "en_US",
        },
        whatsappTemplateParamsCount: {
            type: Number,
            default: 1,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);

const Setting = require("../models/Setting");
require("dotenv").config();

// Ensure default settings exist or fetch them
const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            // Seed with .env defaults if missing
            settings = new Setting({
                otpProvider: process.env.OTP_PROVIDER || 'whatsapp',
                whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
                whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
                whatsappTemplateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
                whatsappTemplateLang: process.env.WHATSAPP_TEMPLATE_LANG || 'en_US',
                whatsappTemplateParamsCount: process.env.WHATSAPP_TEMPLATE_PARAMS_COUNT ? parseInt(process.env.WHATSAPP_TEMPLATE_PARAMS_COUNT, 10) : 1
            });
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Settings
const updateSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting({});
        }

        const {
            otpProvider,
            whatsappPhoneNumberId,
            whatsappAccessToken,
            whatsappTemplateName,
            whatsappTemplateLang,
            whatsappTemplateParamsCount
        } = req.body;

        if (otpProvider) settings.otpProvider = otpProvider;
        if (whatsappPhoneNumberId !== undefined) settings.whatsappPhoneNumberId = whatsappPhoneNumberId;
        if (whatsappAccessToken !== undefined) settings.whatsappAccessToken = whatsappAccessToken;
        if (whatsappTemplateName !== undefined) settings.whatsappTemplateName = whatsappTemplateName;
        if (whatsappTemplateLang !== undefined) settings.whatsappTemplateLang = whatsappTemplateLang;
        if (whatsappTemplateParamsCount !== undefined) settings.whatsappTemplateParamsCount = whatsappTemplateParamsCount;

        await settings.save();
        res.status(200).json({ message: "Settings updated successfully", settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings
};

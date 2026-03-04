const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    videoPath: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("VideoModule", videoSchema);

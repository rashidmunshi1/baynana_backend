const EventBanner = require('../models/EventBanner');
const fs = require('fs');
const path = require('path');

// Create a new event banner
exports.createEventBanner = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        }

        const imagePath = `uploads/eventbanner/${req.file.filename}`;

        const banner = new EventBanner({
            title,
            description,
            image: imagePath,
            isActive: true
        });

        await banner.save();
        res.status(201).json({ message: "Event Banner created successfully", banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all event banners (Admin view)
exports.getAllEventBanners = async (req, res) => {
    try {
        const banners = await EventBanner.find().sort({ createdAt: -1 });
        res.status(200).json(banners);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update event banner
exports.updateEventBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, isActive } = req.body;

        const banner = await EventBanner.findById(id);
        if (!banner) {
            return res.status(404).json({ message: "Event Banner not found" });
        }

        banner.title = title || banner.title;
        banner.description = description || banner.description;
        if (isActive !== undefined) {
            banner.isActive = isActive;
        }

        if (req.file) {
            // Delete old image
            if (banner.image) {
                const oldImagePath = path.join(__dirname, '..', banner.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            banner.image = `uploads/eventbanner/${req.file.filename}`;
        }

        await banner.save();
        res.status(200).json({ message: "Event Banner updated successfully", banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete event banner
exports.deleteEventBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await EventBanner.findById(id);

        if (!banner) {
            return res.status(404).json({ message: "Event Banner not found" });
        }

        // Delete image file
        if (banner.image) {
            const imagePath = path.join(__dirname, '..', banner.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await EventBanner.findByIdAndDelete(id);
        res.status(200).json({ message: "Event Banner deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

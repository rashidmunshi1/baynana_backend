const Banner = require('../models/Banner');
const fs = require('fs');
const path = require('path');

// Create a new banner
exports.createBanner = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        }

        // Normalize path separators to forward slashes for URL consistency
        const imagePath = `uploads/banner/${req.file.filename}`;

        const banner = new Banner({
            title,
            description,
            image: imagePath,
            isActive: true
        });

        await banner.save();
        res.status(201).json({ message: "Banner created successfully", banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all banners (Admin view)
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        res.status(200).json(banners);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update banner
exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, isActive } = req.body;

        const banner = await Banner.findById(id);
        if (!banner) {
            return res.status(404).json({ message: "Banner not found" });
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
            banner.image = `uploads/banner/${req.file.filename}`;
        }

        await banner.save();
        res.status(200).json({ message: "Banner updated successfully", banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ message: "Banner not found" });
        }

        // Delete image file
        if (banner.image) {
            const imagePath = path.join(__dirname, '..', banner.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Banner.findByIdAndDelete(id);
        res.status(200).json({ message: "Banner deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

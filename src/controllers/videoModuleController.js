const VideoModule = require('../models/VideoModule');
const fs = require('fs');
const path = require('path');

// Create a new video entry
exports.createVideo = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Video file is required" });
        }

        // Normalize path separators to forward slashes for URL consistency
        const videoPath = `uploads/videos/${req.file.filename}`;

        const video = new VideoModule({
            title,
            description,
            videoPath: videoPath,
            isActive: true
        });

        await video.save();
        res.status(201).json({ message: "Video uploaded successfully", video });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all videos
exports.getAllVideos = async (req, res) => {
    try {
        const videos = await VideoModule.find().sort({ createdAt: -1 });
        res.status(200).json(videos);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update video details
exports.updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, isActive } = req.body;

        const video = await VideoModule.findById(id);
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        video.title = title || video.title;
        video.description = description !== undefined ? description : video.description;

        if (isActive !== undefined) {
            // "true" / "false" as string from form data check
            video.isActive = isActive === 'true' || isActive === true;
        }

        if (req.file) {
            // Delete old video file
            if (video.videoPath) {
                const oldVideoPath = path.join(__dirname, '..', video.videoPath);
                if (fs.existsSync(oldVideoPath)) {
                    fs.unlinkSync(oldVideoPath);
                }
            }
            video.videoPath = `uploads/videos/${req.file.filename}`;
        }

        await video.save();
        res.status(200).json({ message: "Video updated successfully", video });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete video
exports.deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await VideoModule.findById(id);

        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        // Delete video file
        if (video.videoPath) {
            const tempVideoPath = path.join(__dirname, '..', video.videoPath);
            if (fs.existsSync(tempVideoPath)) {
                fs.unlinkSync(tempVideoPath);
            }
        }

        await VideoModule.findByIdAndDelete(id);
        res.status(200).json({ message: "Video deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

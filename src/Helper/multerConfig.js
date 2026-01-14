const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {   
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex'); 
        const fileExtension = path.extname(file.originalname);
        cb(null, `${Date.now()}-${uniqueSuffix}${fileExtension}`);
    }
});

// File filter for image and video formats
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image and video files are allowed.'));
    }
};

const upload = multer({ storage, fileFilter });
module.exports = upload;

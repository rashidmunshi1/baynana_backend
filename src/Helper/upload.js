// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Ensure directory exists
// const uploadPath = "uploads/category/";

// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage });

// module.exports = upload;


const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ---------- CATEGORY STORAGE ----------
const categoryPath = "uploads/category/";

if (!fs.existsSync(categoryPath)) {
  fs.mkdirSync(categoryPath, { recursive: true });
}

const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, categoryPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadCategory = multer({ storage: categoryStorage });


// ---------- BUSINESS STORAGE ----------
const businessPath = "uploads/business/";

if (!fs.existsSync(businessPath)) {
  fs.mkdirSync(businessPath, { recursive: true });
}

const businessStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, businessPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadBusiness = multer({ storage: businessStorage });


// ---------- BANNER STORAGE ----------
const bannerPath = "uploads/banner/";

if (!fs.existsSync(bannerPath)) {
  fs.mkdirSync(bannerPath, { recursive: true });
}

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bannerPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadBanner = multer({ storage: bannerStorage });


// ---------- PROFILE STORAGE ----------
const profilePath = "uploads/profile/";

if (!fs.existsSync(profilePath)) {
  fs.mkdirSync(profilePath, { recursive: true });
}

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadProfile = multer({ storage: profileStorage });


// EXPORT ALL
module.exports = {
  uploadCategory,
  uploadBusiness,
  uploadBanner,
  uploadProfile
};
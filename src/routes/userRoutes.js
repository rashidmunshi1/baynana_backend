const express = require('express');
const router = express.Router();
const upload = require('../Helper/multerConfig');

const userController = require('../controllers/UserController');
const { sendOtpHandler, verifyOtpHandler } = require('../controllers/otpController');
const { getUserBusinesses, searchBusiness, getBusinessesByCategory } = require("../controllers/businessController")
const { getCategoryByName, getCategoryList } = require("../controllers/categoryController")
const authMiddleware = require('../middleware/authMiddleware');
//user routes
router.get('/user/index', userController.index);
router.post('/register', userController.registerUser);
router.get('/profile/:id/edit', userController.edit);
router.put('/profile/:id/update', upload.single('profileImage'), userController.update);
router.put('/profile/update-name', authMiddleware, userController.updateName);
router.delete('/profile/:id/delete', userController.delete);
router.post('/add-review', userController.addReview);

console.log("Loading User Route: /my-businesses/:mobile");
router.get("/my-businesses/:mobile", getUserBusinesses);
router.get("/search", searchBusiness);
router.get("/business-by-category/:categoryId", getBusinessesByCategory);
router.get("/category/name/:name", getCategoryByName);
router.get("/category/list", getCategoryList);

router.post('/send-otp', sendOtpHandler);
router.post('/verify-otp', verifyOtpHandler);

// Login/Signup Specific Routes
router.post('/login/send-otp', userController.sendLoginOtp);
router.post('/login/verify-otp', userController.verifyLoginOtp);
router.post('/signup/send-otp', userController.sendSignUpOtp);

router.get('/banners', userController.getBanners);

module.exports = router;
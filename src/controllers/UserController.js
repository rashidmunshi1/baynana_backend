const User = require("../models/UserModel");
const Banner = require("../models/Banner");
const VideoModule = require("../models/VideoModule");
const EventBanner = require("../models/EventBanner");
const Review = require("../models/Review");
const Business = require("../models/Business");
const sendOtp = require("../Helper/otpService");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateOtp = () => "123456"; // TESTING OTP

const UserController = {

    // Fetch all users
    index: async (req, res) => {
        try {
            const users = await User.find();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Create a new user
    store: async (req, res) => {
        try {
            const { name, mobileno, otp, address, pincode } = req.body;

            // Capture the uploaded profile image path using multer
            const profileImage = req.file ? req.file.path.replace(/\\/g, '/') : null;

            const newUser = new User({
                name,
                mobileno,
                otp,
                address,
                pincode,
                profileImage
            });

            const savedUser = await newUser.save();
            res.status(201).json(savedUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Fetch a single user by ID
    edit: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update a user by ID
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, address, pincode } = req.body;

            let profileImage = null;

            if (req.file) {
                // Only store relative path, not full system path
                const filename = req.file.filename;
                profileImage = `uploads/profile/${filename}`;
            }

            const updateData = { name, address, pincode };

            if (profileImage) {
                updateData.profileImage = profileImage;
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Delete a user by ID
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);
            if (!deletedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    totalusercount: async (req, res) => {
        try {
            const total = await User.countDocuments();
            res.status(200).json({ total });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getBanners: async (req, res) => {
        try {
            const currentDate = new Date();
            const query = {
                isActive: true,
                $and: [
                    { $or: [{ startDate: null }, { startDate: { $lte: currentDate } }] },
                    { $or: [{ endDate: null }, { endDate: { $gte: currentDate } }] }
                ]
            };
            const banners = await Banner.find(query);
            res.status(200).json(banners);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getEventBanners: async (req, res) => {
        try {
            const banners = await EventBanner.find({ isActive: true });
            res.status(200).json(banners);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getVideos: async (req, res) => {
        try {
            const videos = await VideoModule.find({ isActive: true });
            res.status(200).json(videos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateName: async (req, res) => {
        try {
            const { name } = req.body;
            const user = req.user;

            if (!name) {
                return res.status(400).json({ message: "Name is required" });
            }

            user.name = name;
            await user.save();

            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    registerUser: async (req, res) => {
        try {
            const { phoneNumber, name } = req.body;

            if (!phoneNumber || phoneNumber.length !== 10) {
                return res
                    .status(400)
                    .json({ message: "Enter valid 10-digit phone number" });
            }

            if (!name) {
                return res.status(400).json({ message: "Name is required" });
            }

            const dbNumber = `91${phoneNumber}`;

            let user = await User.findOne({ mobileno: dbNumber });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found. Please register first.",
                });
            }

            user.name = name;
            await user.save();

            return res.status(200).json({
                success: true,
                message: "User name updated successfully",
                userId: user._id,
                name: user.name,
            });
        } catch (error) {
            return res.status(500).json({
                message: "Failed to update user name",
                error: error.message,
            });
        }
    },

    // ===================== LOGIN SEND OTP =====================
    sendLoginOtp: async (req, res) => {
        try {
            const { phoneNumber } = req.body;

            if (!phoneNumber || phoneNumber.length !== 10) {
                return res.status(400).json({ message: "Enter valid 10-digit phone number" });
            }

            const dbNumber = `91${phoneNumber}`;
            const twilioNumber = `+91${phoneNumber}`;

            // Check if user exists
            const user = await User.findOne({ mobileno: dbNumber });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Number not found",
                    isRegistered: false // Flag to frontend
                });
            }

            // Generate and Save OTP
            const otp = generateOtp();
            user.otp = otp;
            await user.save();

            // Send OTP
            await sendOtp(twilioNumber, otp);

            return res.status(200).json({
                success: true,
                message: "OTP sent successfully",
                otp, // REMOVE IN PRODUCTION
                isRegistered: true
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to send OTP",
                error: error.message,
            });
        }
    },

    // ===================== LOGIN VERIFY OTP =====================
    verifyLoginOtp: async (req, res) => {
        try {
            const { phoneNumber, otp } = req.body;

            if (!phoneNumber || !otp) {
                return res.status(400).json({ message: "Phone number and OTP required" });
            }

            const dbNumber = `91${phoneNumber}`;

            const user = await User.findOne({ mobileno: dbNumber });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.otp !== otp) {
                return res.status(400).json({ message: "Invalid OTP" });
            }

            // Clear OTP
            user.otp = null;
            await user.save();

            // Generate Token
            const token = jwt.sign(
                { id: user._id, mobile: user.mobileno },
                process.env.JWT_SECRET || "DEFAULT_SECRET_KEY",
                { expiresIn: "7d" }
            );

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    mobile: user.mobileno,
                    profileImage: user.profileImage
                }
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to verify OTP",
                error: error.message,
            });
        }
    },

    // ===================== SIGNUP SEND OTP =====================
    sendSignUpOtp: async (req, res) => {
        try {
            const { phoneNumber } = req.body;

            if (!phoneNumber || phoneNumber.length !== 10) {
                return res.status(400).json({ message: "Enter valid 10-digit phone number" });
            }

            const dbNumber = `91${phoneNumber}`;
            const twilioNumber = `+91${phoneNumber}`;

            let user = await User.findOne({ mobileno: dbNumber });

            if (user) {
                // If user exists AND has a name, they are already registered
                if (user.name) {
                    return res.status(400).json({
                        success: false,
                        message: "User already registered. Please Login."
                    });
                }
                // If user exists but NO name, it's a re-attempt at signup. Generate new OTP.
            } else {
                // Create new user
                user = new User({
                    mobileno: dbNumber
                });
            }

            const otp = generateOtp();
            user.otp = otp;
            await user.save();

            // Send OTP
            await sendOtp(twilioNumber, otp);

            return res.status(200).json({
                success: true,
                message: "OTP sent successfully",
                otp, // REMOVE IN PRODUCTION
            });

        } catch (error) {
            return res.status(500).json({
                message: "Failed to send OTP",
                error: error.message,
            });
        }
    },

    // ===================== ADD REVIEW =====================
    addReview: async (req, res) => {
        try {
            const { businessId, userId, rating, review } = req.body;

            if (!businessId || !userId || !rating) {
                return res.status(400).json({ message: "BusinessId, UserId and Rating are required" });
            }

            // Check if user is the owner of the business
            const business = await Business.findById(businessId);
            if (!business) {
                return res.status(404).json({ message: "Business not found" });
            }

            if (business.userId.toString() === userId.toString()) {
                return res.status(400).json({ success: false, message: "Owners cannot review their own business." });
            }

            // Check if user already reviewed this business
            const existingReview = await Review.findOne({ businessId, userId });
            if (existingReview) {
                return res.status(400).json({ success: false, message: "You have already reviewed this business. Please update your existing review." });
            }

            // Create Review
            const newReview = new Review({ businessId, userId, rating, review });
            await newReview.save();

            // Update Business Stats (Rating & Count)
            const currentCount = business.ratingCount || 0;
            const currentRating = business.rating || 0;

            const newCount = currentCount + 1;
            // Calculate new average
            const newRating = ((currentRating * currentCount) + rating) / newCount;

            business.ratingCount = newCount;
            business.rating = parseFloat(newRating.toFixed(1));
            await business.save();

            return res.status(201).json({ success: true, message: "Review added successfully", review: newReview });

        } catch (error) {
            return res.status(500).json({ message: "Failed to add review", error: error.message });
        }
    },

    // ===================== UPDATE REVIEW =====================
    updateReview: async (req, res) => {
        try {
            const { id } = req.params; // Review ID
            const { rating, review } = req.body;

            if (!rating) {
                return res.status(400).json({ message: "Rating is required" });
            }

            const existingReview = await Review.findById(id);
            if (!existingReview) {
                return res.status(404).json({ message: "Review not found" });
            }

            const oldRating = existingReview.rating;
            existingReview.rating = rating;
            existingReview.review = review;
            await existingReview.save();

            // Update Business Stats
            const business = await Business.findById(existingReview.businessId);
            if (business) {
                const currentCount = business.ratingCount || 1; // prevent div by zero
                const currentRating = business.rating || 0;

                // Adjusted average: Remove old rating, add new rating
                let newRating = ((currentRating * currentCount) - oldRating + rating) / currentCount;
                if (newRating < 0) newRating = 0;

                business.rating = parseFloat(newRating.toFixed(1));
                await business.save();
            }

            return res.status(200).json({ success: true, message: "Review updated successfully", review: existingReview });
        } catch (error) {
            return res.status(500).json({ message: "Failed to update review", error: error.message });
        }
    },

    // ===================== DELETE REVIEW =====================
    deleteReview: async (req, res) => {
        try {
            const { id } = req.params; // Review ID

            const existingReview = await Review.findById(id);
            if (!existingReview) {
                return res.status(404).json({ message: "Review not found" });
            }

            await Review.findByIdAndDelete(id);

            // Update Business Stats
            const business = await Business.findById(existingReview.businessId);
            if (business) {
                const currentCount = business.ratingCount || 1;
                const currentRating = business.rating || 0;

                const newCount = currentCount - 1;
                let newRating = 0;

                if (newCount > 0) {
                    newRating = ((currentRating * currentCount) - existingReview.rating) / newCount;
                }

                business.ratingCount = newCount;
                business.rating = parseFloat(newRating.toFixed(1));
                await business.save();
            }

            return res.status(200).json({ success: true, message: "Review deleted successfully" });
        } catch (error) {
            return res.status(500).json({ message: "Failed to delete review", error: error.message });
        }
    }
};

module.exports = UserController;

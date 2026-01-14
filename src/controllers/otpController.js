const User = require("../models/UserModel.js");
const sendOtp = require("../Helper/twilioService");
const jwt = require("jsonwebtoken");
require("dotenv").config();


const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();


// ===================== SEND OTP =====================
const sendOtpHandler = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || phoneNumber.length !== 10) {
      return res
        .status(400)
        .json({ message: "Enter valid 10-digit phone number" });
    }

    const dbNumber = `91${phoneNumber}`;
    const twilioNumber = `+91${phoneNumber}`;
    const otp = generateOtp();

    let user = await User.findOne({ mobileno: dbNumber });

    if (!user) {
      user = new User({
        mobileno: dbNumber,
        otp,
      });
    } else {
      user.otp = otp;
    }

    await user.save();
    await sendOtp(twilioNumber, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      userId: user._id,
      otp, // remove in production
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

// ===================== VERIFY OTP =====================
const verifyOtpHandler = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: "Phone number and OTP required" });
    }

    const dbNumber = phoneNumber.startsWith("91")
      ? phoneNumber
      : `91${phoneNumber}`;

    const user = await User.findOne({ mobileno: dbNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please send OTP again." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, mobile: user.mobileno },
      process.env.JWT_SECRET || "DEFAULT_SECRET_KEY",
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name || "",
        mobile: user.mobileno,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};
// ===================== EXPORT BOTH =====================
module.exports = { sendOtpHandler, verifyOtpHandler };

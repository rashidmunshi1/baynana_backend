const Admin = require("../models/Admin");
const Banner = require("../models/Banner");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Register Admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const isExist = await Admin.findOne({ email });
    if (isExist) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPass
    });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: newAdmin
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Login Admin
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin._id },
      "SECRET123",           // Replace with .env
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      admin
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // Create token for password reset
    const resetToken = jwt.sign(
      { id: admin._id },
      "SECRET123",
      { expiresIn: "15m" }
    );

    // Email sender
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "chamanalfaiz@gmail.com",
        pass: "egbf psdn aoyn riqt"
      }
    });

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    await transporter.sendMail({
      to: email,
      subject: "Reset Password",
      html: `<p>Click below link to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>`
    });

    res.status(200).json({ message: "Reset link sent to your email" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;  // <-- match frontend: password

    const decoded = jwt.verify(token, "SECRET123");

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.findByIdAndUpdate(decoded.id, {
      password: hashedPassword
    });

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Link expired. Try again" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Banner Management
exports.addBanner = async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file ? req.file.path.replace(/\\/g, '/') : null;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newBanner = await Banner.create({
      title,
      image,
      description
    });

    res.status(201).json({
      message: "Banner added successfully",
      banner: newBanner
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isActive } = req.body;
    let image = null;

    if (req.file) {
      image = req.file.path.replace(/\\/g, '/');
    }

    const updateData = { title, description, isActive };
    if (image) {
      updateData.image = image;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({
      message: "Banner updated successfully",
      banner: updatedBanner
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBanner = await Banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({ message: "Banner deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


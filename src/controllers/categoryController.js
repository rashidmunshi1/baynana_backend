const Category = require("../models/Category");

exports.addCategory = async (req, res) => {
  try {
    const { name, image, parentCategory } = req.body;

    const exist = await Category.findOne({ name });
    if (exist) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({
      name,
      image: req.file ? req.file.filename : null,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: req.body.description || "",
      status: req.body.status || "active",
      orderPriority: req.body.orderPriority || 0,
    });

    res.status(201).json({ message: "Category added", category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ parentCategory: null }).select(
      "_id name image slug description orderPriority status"
    ).sort({ orderPriority: 1 });
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getParentCategories = async (req, res) => {
  try {
    const parents = await Category.find({ parentCategory: null }).select("_id name");

    return res.status(200).json({
      success: true,
      data: parents,
    });

  } catch (error) {
    console.error("Error fetching parent categories:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.totalcategotycount = async (req, res) => {
  try {
    const total = await Category.countDocuments({ parentCategory: null });
    res.status(200).json({ total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryByName = async (req, res) => {
  try {
    const { name } = req.params;

    // Convert URL name → normal text
    const categoryName = decodeURIComponent(name);

    const category = await Category.findOne({
      name: { $regex: `^${categoryName}$`, $options: "i" }, // case-insensitive
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get all category list for user
exports.getCategoryList = async (req, res) => {
  try {
    const categories = await Category.find({ status: "Active", parentCategory: null }).select(
      "_id name image slug description orderPriority"
    ).sort({ orderPriority: 1 });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, orderPriority } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (description) category.description = description;
    if (status) category.status = status;
    if (orderPriority) category.orderPriority = orderPriority;

    if (req.file) {
      // Delete old image if exists
      const fs = require('fs');
      const path = require('path');
      if (category.image) {
        // Path construction matches `upload.js` which uses "uploads/category/" relative to root (?)
        // but this controller is in src/controllers. upload.js creates uploads in root?
        // Let's assume root is one level up from src.
        // If JustDial is root:
        // justdial/uploads/category/filename
        // Controller: justdial/src/controllers/categoryController.js
        // .. -> src
        // .. -> justdial
        // uploads/category
        const oldImagePath = path.join(__dirname, '../../uploads/category', category.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      category.image = req.file.filename;
    }

    await category.save();
    res.status(200).json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.image) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../uploads/category', category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
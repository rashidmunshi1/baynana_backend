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
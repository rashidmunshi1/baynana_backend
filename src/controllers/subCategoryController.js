const Category = require("../models/Category");

// Add Subcategory
exports.addSubCategory = async (req, res) => {
    try {
        const { name, parentCategory, description, status, orderPriority } = req.body;

        // Validation
        if (!parentCategory) {
            return res.status(400).json({ message: "Parent category is required" });
        }

        const parent = await Category.findById(parentCategory);
        if (!parent) {
            return res.status(404).json({ message: "Parent category not found" });
        }

        // Check if subcategory exists
        const existing = await Category.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: "Category with this name already exists" });
        }

        const subCategory = await Category.create({
            name,
            image: req.file ? req.file.filename : null,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            description: description || "",
            status: status || "Active",
            orderPriority: orderPriority || 0,
            parentCategory: parent._id
        });

        res.status(201).json({ message: "Subcategory added successfully", subCategory });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Subcategories (All categories with parentCategory != null)
exports.getAllSubCategories = async (req, res) => {
    try {
        const subCategories = await Category.find({ parentCategory: { $ne: null } })
            .populate("parentCategory", "name")
            .sort({ orderPriority: 1 });
        res.status(200).json(subCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Subcategories by Parent ID
exports.getSubCategoriesByParent = async (req, res) => {
    try {
        const { parentId } = req.params;
        const subCategories = await Category.find({ parentCategory: parentId })
            .populate("parentCategory", "name")
            .sort({ orderPriority: 1 });

        res.status(200).json(subCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update SubCategory
exports.updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        if (req.file) {
            updates.image = req.file.filename;
        }

        if (updates.name) {
            updates.slug = updates.name.toLowerCase().replace(/\s+/g, '-');
        }

        const updatedSubCategory = await Category.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedSubCategory) return res.status(404).json({ message: "Subcategory not found" });

        res.status(200).json({ message: "Subcategory updated", updatedSubCategory });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete SubCategory
exports.deleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Category.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Subcategory not found" });
        res.status(200).json({ message: "Subcategory deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

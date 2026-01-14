const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  orderPriority: { type: Number, default: 0 },

  // If parentCategory is null → This is a MAIN CATEGORY
  // If parentCategory has value → This is a SUBCATEGORY
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
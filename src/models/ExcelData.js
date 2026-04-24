const mongoose = require("mongoose");

const excelDataSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  categories: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("ExcelData", excelDataSchema);

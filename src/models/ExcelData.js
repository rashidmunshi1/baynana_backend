const mongoose = require("mongoose");

const excelDataSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  categories: { type: [String], default: [] },
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: "ExcelUpload" },
}, { timestamps: true });

module.exports = mongoose.model("ExcelData", excelDataSchema);

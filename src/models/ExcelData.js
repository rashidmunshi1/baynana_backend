const mongoose = require("mongoose");

const excelDataSchema = new mongoose.Schema({
  title: { type: String, required: false },
  description: { type: String, default: "" },
  category: { type: String, default: "" },
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: "ExcelUpload" },
}, { timestamps: true });

module.exports = mongoose.model("ExcelData", excelDataSchema);

const mongoose = require("mongoose");

const excelUploadSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  recordCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("ExcelUpload", excelUploadSchema);

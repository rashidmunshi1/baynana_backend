const ExcelData = require("../models/ExcelData");
const ExcelUpload = require("../models/ExcelUpload");

exports.uploadExcelData = async (req, res) => {
  try {
    const { data, fileName } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: "No data provided" });
    }

    // Create an upload record
    const uploadRecord = await ExcelUpload.create({
        fileName: fileName || "Untitled Upload",
        recordCount: data.length
    });

    // Tag each data item with the uploadId
    const dataWithUploadId = data.map(item => ({
        ...item,
        uploadId: uploadRecord._id
    }));

    const insertedData = await ExcelData.insertMany(dataWithUploadId);

    return res.status(200).json({ 
        success: true, 
        message: "Excel data uploaded successfully", 
        count: insertedData.length,
        upload: uploadRecord
    });
  } catch (error) {
    console.error("Excel upload error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExcelData = async (req, res) => {
  try {
    const data = await ExcelData.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExcelDataByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const data = await ExcelData.find({ categories: categoryName }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.searchExcelData = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }
    const data = await ExcelData.find({
      $or: [
        { categories: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } }
      ]
    }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUploads = async (req, res) => {
    try {
        const uploads = await ExcelUpload.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: uploads });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getExcelDataByUploadId = async (req, res) => {
    try {
        const { uploadId } = req.params;
        const data = await ExcelData.find({ uploadId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteExcelUpload = async (req, res) => {
    try {
        const { uploadId } = req.params;
        
        // Delete the upload record
        await ExcelUpload.findByIdAndDelete(uploadId);
        
        // Delete all associated data
        await ExcelData.deleteMany({ uploadId });
        
        return res.status(200).json({ success: true, message: "Upload and associated data deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

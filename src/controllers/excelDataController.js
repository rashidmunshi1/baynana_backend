const ExcelData = require("../models/ExcelData");

exports.uploadExcelData = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: "No data provided" });
    }

    const insertedData = await ExcelData.insertMany(data);

    return res.status(200).json({ 
        success: true, 
        message: "Excel data uploaded successfully", 
        count: insertedData.length 
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

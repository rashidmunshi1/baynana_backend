const express = require("express");
const router = express.Router();
const settingController = require("../controllers/settingController");
// const authMiddleware = require("../middleware/authMiddleware"); // assuming you have admin auth, if so add it

// Route to get global settings
router.get("/", settingController.getSettings);

// Route to update global settings
router.put("/", settingController.updateSettings);

module.exports = router;

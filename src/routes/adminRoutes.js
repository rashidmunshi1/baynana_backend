const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin, forgotPassword, resetPassword, getProfile, updateProfile } = require("../controllers/adminController");
const { createBanner, getAllBanners, updateBanner, deleteBanner } = require("../controllers/bannerController");
const { createVideo, getAllVideos, updateVideo, deleteVideo } = require("../controllers/videoModuleController");
const { createEventBanner, getAllEventBanners, updateEventBanner, deleteEventBanner } = require("../controllers/eventBannerController");
const { addCategory, getCategories, getParentCategories, totalcategotycount, updateCategory, deleteCategory } = require("../controllers/categoryController");
const {
  addBusiness,
  updateBusiness,
  getAllBusiness,
  getBusinessById,
  totalbusiness,
  deleteBusiness,
} = require("../controllers/businessController");
const userController = require("../controllers/UserController");
const { uploadCategory, uploadBusiness, uploadBanner, uploadProfile, uploadVideo, uploadEventBanner } = require("../Helper/upload");
const {
  addSubCategory,
  getAllSubCategories,
  getSubCategoriesByParent,
  updateSubCategory,
  deleteSubCategory
} = require("../controllers/subCategoryController");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);


// Admin adds category
router.post("/add-category", uploadCategory.single("image"), addCategory);
router.get("/all-category", getCategories);
router.get("/parent-category", getParentCategories);
router.get("/total-category", totalcategotycount);
router.put("/update-category/:id", uploadCategory.single("image"), updateCategory);
router.delete("/delete-category/:id", deleteCategory);

// Admin adds sub-category (Moved from subCategoryRoutes)
router.post("/add-subcategory", uploadCategory.single("image"), addSubCategory);
router.get("/all-subcategory", getAllSubCategories);
router.get("/subcategory/parent/:parentId", getSubCategoriesByParent);
router.put("/update-subcategory/:id", uploadCategory.single("image"), updateSubCategory);
router.delete("/delete-subcategory/:id", deleteSubCategory);

// Upload multiple images
router.post("/add-business", uploadBusiness.array("images", 10), addBusiness);
router.put("/update-business/:id", uploadBusiness.array("images", 10), updateBusiness);
router.get("/all-business", getAllBusiness);
router.get("/business/:id", getBusinessById);
router.delete("/business/delete/:id", deleteBusiness);
console.log("Loading Admin Route: /business/toggle-status/:id");
router.put("/business/toggle-status/:id", require("../controllers/businessController").toggleBusinessStatus);
router.put("/business/bulk-status", require("../controllers/businessController").bulkUpdateStatus);
router.get("/total-business", totalbusiness);


//user routes
router.get('/all-users', userController.index);
router.get('/all-users', userController.index);
router.get('/total-users', userController.totalusercount);
router.put('/update-user/:id', uploadProfile.single('profileImage'), userController.update);
router.delete('/delete-user/:id', userController.delete);

// Banner routes
router.post("/add-banner", uploadBanner.single("image"), createBanner);
router.get("/all-banners", getAllBanners);
router.put("/update-banner/:id", uploadBanner.single("image"), updateBanner);
router.delete("/delete-banner/:id", deleteBanner);

// Video routes
router.post("/add-video", uploadVideo.single("video"), createVideo);
router.get("/all-videos", getAllVideos);
router.put("/update-video/:id", uploadVideo.single("video"), updateVideo);
router.delete("/delete-video/:id", deleteVideo);

// Event Banner routes
router.post("/add-event-banner", uploadEventBanner.single("image"), createEventBanner);
router.get("/all-event-banners", getAllEventBanners);
router.put("/update-event-banner/:id", uploadEventBanner.single("image"), updateEventBanner);
router.delete("/delete-event-banner/:id", deleteEventBanner);

module.exports = router;

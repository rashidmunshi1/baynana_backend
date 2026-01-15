const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin, forgotPassword, resetPassword } = require("../controllers/adminController");
const { createBanner, getAllBanners, updateBanner, deleteBanner } = require("../controllers/bannerController");
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
const { uploadCategory, uploadBusiness, uploadBanner, uploadProfile } = require("../Helper/upload");
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

module.exports = router;

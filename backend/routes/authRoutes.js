const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  refreshAccessToken,
  logout,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");

const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  refreshTokenValidation,
} = require("../validators/authValidator");

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/refresh-token", refreshTokenValidation, refreshAccessToken);

// ---------------------------------------------------------------------------
// Protected routes (require valid access token)
// ---------------------------------------------------------------------------
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfileValidation, updateProfile);
router.post("/logout", protect, logout);
router.post("/change-password", protect, changePasswordValidation, changePassword);

module.exports = router;

const { body } = require("express-validator");

// ---------------------------------------------------------------------------
// Registration validation rules
// ---------------------------------------------------------------------------
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Please enter a valid phone number (e.g. +919876543210)"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
];

// ---------------------------------------------------------------------------
// Login validation rules
// ---------------------------------------------------------------------------
const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

// ---------------------------------------------------------------------------
// Profile update validation rules
// ---------------------------------------------------------------------------
const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Please enter a valid phone number"),
];

// ---------------------------------------------------------------------------
// Change password validation rules
// ---------------------------------------------------------------------------
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("New password must contain at least one number"),
];

// ---------------------------------------------------------------------------
// Refresh token validation rules
// ---------------------------------------------------------------------------
const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  refreshTokenValidation,
};

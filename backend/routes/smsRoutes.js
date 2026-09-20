/**
 * SMS Detection Routes
 *
 * POST /api/sms/detect — Analyze an SMS message for fraud
 *   Requires: Bearer JWT access token
 *   Body:     { text: string }
 *   Returns:  { prediction, fraud_probability, confidence }
 */

const express  = require("express");
const router   = express.Router();
const { detect } = require("../controllers/smsController");
const { protect }= require("../middlewares/authMiddleware");

// All SMS routes require authentication
router.post("/detect", protect, detect);

module.exports = router;

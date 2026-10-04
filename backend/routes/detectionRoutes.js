const express = require("express");
const { createDetection, getHistory, getDetectionById, clearHistory } = require("../controllers/detectionController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect all detection routes
router.use(protect);

router.post("/", createDetection);
router.get("/history", getHistory);
router.delete("/history", clearHistory);
router.get("/:id", getDetectionById);

module.exports = router;

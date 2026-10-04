const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["SMS", "URL", "TRANSACTION"],
    required: true,
  },
  input: {
    type: String,
    required: true,
  },
  preview: {
    type: String,
  },
  result: {
    type: String,
  },
  riskScore: {
    type: Number,
  },
  riskLevel: {
    type: String,
    enum: ["SAFE", "SUSPICIOUS", "HIGH_RISK"],
  },
  model: {
    type: String,
  },
  confidence: {
    type: Number,
  },
  detectedSignals: {
    type: [String],
    default: [],
  },
  reasons: {
    type: [String],
    default: [],
  },
  recommendation: {
    type: String,
  },
  scamType: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Detection", detectionSchema);

const Detection = require("../models/Detection");

const createDetection = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const { type, input, result, riskScore, riskLevel, model, confidence, detectedSignals, reasons, recommendation, scamType, preview } = req.body;

    const detection = await Detection.create({
      userId: req.user.id,
      type,
      input,
      preview,
      result,
      riskScore,
      riskLevel,
      model,
      confidence,
      detectedSignals,
      reasons,
      recommendation,
      scamType
    });

    res.status(201).json({ success: true, data: detection });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const history = await Detection.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};

const getDetectionById = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const detection = await Detection.findOne({ _id: req.params.id, userId: req.user.id });

    if (!detection) {
      return res.status(404).json({ success: false, message: "Detection not found" });
    }

    res.status(200).json({ success: true, data: detection });
  } catch (error) {
    next(error);
  }
};

const clearHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    await Detection.deleteMany({ userId: req.user.id });

    res.status(200).json({ success: true, message: "History cleared successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createDetection, getHistory, getDetectionById, clearHistory };

const Detection = require("../models/Detection");
const { analyzeUrl } = require("../utils/urlAnalyzer");

const analyze = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }

    const analysisResult = analyzeUrl(url);

    // Optionally save to DB if user is authenticated
    if (req.user) {
      const detection = await Detection.create({
        userId: req.user.id,
        type: "URL",
        input: url,
        result: analysisResult.isMalicious ? "MALICIOUS" : "SAFE",
        riskScore: analysisResult.riskScore,
        riskLevel: analysisResult.riskLevel,
        model: "RuleBased",
        confidence: 100, // Deterministic rules
        detectedSignals: analysisResult.detectedSignals,
        reasons: analysisResult.reasons,
        recommendation: analysisResult.recommendation
      });
      analysisResult.detectionId = detection._id;
    }

    res.status(200).json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyze };

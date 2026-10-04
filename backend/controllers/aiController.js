const { generateExplanation, askAIQuestion } = require("../utils/aiService");
const Detection = require("../models/Detection");

const explainResult = async (req, res, next) => {
  try {
    const { detectionId, detectionData } = req.body;
    let dataToExplain = detectionData;

    // If detectionId is provided and user is authenticated, fetch from DB
    if (detectionId && req.user) {
      const detection = await Detection.findOne({ _id: detectionId, userId: req.user.id });
      if (!detection) {
        return res.status(404).json({ success: false, message: "Detection not found" });
      }
      dataToExplain = detection;
    }

    if (!dataToExplain) {
      return res.status(400).json({ success: false, message: "No detection data provided to explain" });
    }

    const explanation = await generateExplanation(dataToExplain);

    res.status(200).json({ success: true, data: explanation });
  } catch (error) {
    next(error);
  }
};

const askQuestion = async (req, res, next) => {
  try {
    const { question, context } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    let finalContext = context;
    if (req.body.detectionId && req.user) {
      const detection = await Detection.findOne({ _id: req.body.detectionId, userId: req.user.id });
      if (detection) {
        finalContext = detection;
      }
    }

    const answer = await askAIQuestion(question, finalContext);

    res.status(200).json({ success: true, data: { answer } });
  } catch (error) {
    next(error);
  }
};

module.exports = { explainResult, askQuestion };

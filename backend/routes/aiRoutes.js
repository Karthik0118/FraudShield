const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { explainResult, askQuestion } = require("../controllers/aiController");

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      // Ignored for optional auth
    }
  }
  next();
};

const router = express.Router();

router.post("/explain", optionalAuth, explainResult);
router.post("/ask", optionalAuth, askQuestion);

module.exports = router;

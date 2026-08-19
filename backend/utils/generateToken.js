const jwt = require("jsonwebtoken");

/**
 * Generate a JWT access token (short-lived).
 * @param {string} userId - The user's MongoDB _id.
 * @returns {string} Signed JWT access token.
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
  });
};

/**
 * Generate a JWT refresh token (long-lived).
 * @param {string} userId - The user's MongoDB _id.
 * @returns {string} Signed JWT refresh token.
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
  });
};

module.exports = { generateAccessToken, generateRefreshToken };

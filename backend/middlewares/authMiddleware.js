const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to protect routes — verifies the JWT access token
 * from the Authorization header (Bearer <token>).
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from "Bearer <token>" header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — no token provided",
    });
  }

  try {
    // Verify the access token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — user not found",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — token invalid or expired",
    });
  }
};

/**
 * Middleware to restrict access to specific roles.
 * @param  {...string} roles - Allowed roles (e.g., "admin").
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };

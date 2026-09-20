/**
 * SMS Detection Controller
 *
 * Validates the SMS text and proxies the request to the
 * Python ML FastAPI service, then returns the prediction result.
 *
 * Endpoint: POST /api/sms/detect
 * Auth:     Required (protect middleware attaches req.user)
 */

const https = require("https");
const http  = require("http");

// ── ML service base URL from env (default: http://localhost:8000) ────────────
const ML_API_URL = (process.env.ML_API_URL || "http://localhost:8000").replace(/\/$/, "");

/**
 * POST /api/sms/detect
 * Body: { text: string }
 */
const detect = async (req, res, next) => {
  try {
    const { text } = req.body;

    // ── Input Validation ────────────────────────────────────────────────────
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        message: "SMS text is required.",
      });
    }

    const trimmed = text.trim();

    if (trimmed.length === 0) {
      return res.status(400).json({
        success: false,
        message: "SMS text cannot be empty.",
      });
    }

    if (trimmed.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "SMS text must not exceed 2000 characters.",
      });
    }

    // ── Call Python ML Service ────────────────────────────────────────────────
    const payload = JSON.stringify({ text: trimmed });

    const mlResponse = await callMLService(`${ML_API_URL}/predict`, payload);

    // ── Return to Client ──────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: "SMS analyzed successfully.",
      data: {
        prediction:        mlResponse.prediction,         // "Legitimate" | "Fraudulent"
        fraud_probability: mlResponse.fraud_probability,  // 0.0 – 1.0
        confidence:        mlResponse.confidence,         // max class probability
        label_id:          mlResponse.label_id,           // 0 | 1
      },
    });

  } catch (error) {
    // ML service is down or unreachable
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({
        success: false,
        message: "The fraud detection service is currently unavailable. Please try again later.",
        error_code: "ML_SERVICE_UNAVAILABLE",
      });
    }

    // ML service returned an error response
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message || "ML service error.",
      });
    }

    next(error);
  }
};

/**
 * Helper: HTTP/HTTPS POST to the ML service
 * Returns parsed JSON response body.
 */
function callMLService(url, payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port:     parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path:     parsedUrl.pathname,
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 30000, // 30s timeout for inference
    };

    const req = transport.request(options, (mlRes) => {
      let body = "";
      mlRes.on("data", (chunk) => { body += chunk; });
      mlRes.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (mlRes.statusCode >= 200 && mlRes.statusCode < 300) {
            resolve(parsed);
          } else {
            const err = new Error(parsed.detail || parsed.message || "ML service error");
            err.statusCode = mlRes.statusCode;
            reject(err);
          }
        } catch {
          const err = new Error("Invalid response from ML service");
          err.statusCode = 502;
          reject(err);
        }
      });
    });

    req.on("error",   reject);
    req.on("timeout", () => {
      req.destroy();
      const err = new Error("ML service request timed out");
      err.code = "ETIMEDOUT";
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

module.exports = { detect };

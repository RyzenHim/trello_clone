const jwt = require("jsonwebtoken");
const prisma = require("../config/prismaClient");

const secretKey = process.env.SECRET_KEY;

async function attachUser(req, res, next, { required }) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      if (!required) {
        req.user = null;
        return next();
      }

      return res.status(401).json({ message: "Authentication required" });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, secretKey);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Token expired. Please login again.",
          expired: true,
        });
      }

      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  return attachUser(req, res, next, { required: true });
}

function optionalAuth(req, res, next) {
  return attachUser(req, res, next, { required: false });
}

module.exports = requireAuth;
module.exports.optionalAuth = optionalAuth;

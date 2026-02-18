const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

/**
 * Middleware that protects routes by verifying the JWT token
 * sent in the Authorization header (Bearer <token>).
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Extract token from "Authorization: Bearer <token>"
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            logger.warn(`Auth middleware — no token provided for ${req.method} ${req.originalUrl}`);
            return res
                .status(401)
                .json({ message: "Not authorized — no token provided" });
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Attach user to request (exclude password)
        const user = await User.findById(decoded.id);
        if (!user) {
            logger.warn(`Auth middleware — user not found for token id: ${decoded.id}`);
            return res
                .status(401)
                .json({ message: "Not authorized — user no longer exists" });
        }

        req.user = user;
        logger.debug(`Auth middleware — authenticated user: ${user._id}`);
        next();
    } catch (error) {
        logger.warn(`Auth middleware — invalid token for ${req.method} ${req.originalUrl}: ${error.message}`);
        return res
            .status(401)
            .json({ message: "Not authorized — token invalid or expired" });
    }
};

module.exports = protect;

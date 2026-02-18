const logger = require("../utils/logger");

/**
 * Middleware that restricts access to admin-only routes.
 * Must be used AFTER the protect (JWT auth) middleware.
 */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        logger.warn(`Admin access denied for user: ${req.user?._id} (role: ${req.user?.role})`);
        return res.status(403).json({ message: "Access denied — admin only" });
    }
};

module.exports = adminOnly;

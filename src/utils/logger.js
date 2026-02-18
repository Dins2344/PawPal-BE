const { createLogger, format, transports } = require("winston");
const path = require("path");

// ─── Custom format: timestamp + level + message ─────────────────────────────
const logFormat = format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
});

// ─── Create Winston logger ──────────────────────────────────────────────────
const logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.errors({ stack: true }),
        logFormat
    ),
    transports: [
        // Console output (colorized for dev readability)
        new transports.Console({
            format: format.combine(
                format.colorize({ all: true }),
                format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                logFormat
            ),
        }),

        // All logs → logs/app.log
        new transports.File({
            filename: path.join("logs", "app.log"),
            maxsize: 5 * 1024 * 1024, // 5 MB
            maxFiles: 5,
        }),

        // Error-only logs → logs/error.log
        new transports.File({
            filename: path.join("logs", "error.log"),
            level: "error",
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
    ],
});

module.exports = logger;

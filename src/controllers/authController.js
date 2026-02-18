const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

// ─── Helper: generate JWT ───────────────────────────────────────────────────
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

// ─── Helper: build the response payload (matches frontend AuthResponse) ─────
const buildAuthResponse = (user, token) => ({
    token,
    user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
    },
});

// ─── POST /auth/register ────────────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;
        logger.info(`Register attempt for email: ${email}`);

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn(`Registration failed — email already exists: ${email}`);
            return res.status(400).json({ message: "Email already registered" });
        }

        // Create new user (password is hashed automatically by the pre-save hook)
        const user = await User.create({ fullName, email, phone, password });

        // Generate token & respond
        const token = generateToken(user._id);
        logger.info(`User registered successfully: ${user._id} (${email})`);
        return res.status(201).json(buildAuthResponse(user, token));
    } catch (error) {
        logger.error(`Register error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error during registration" });
    }
};

// ─── POST /auth/login ───────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        logger.info(`Login attempt for email: ${email}`);

        // Validate input
        if (!email || !password) {
            logger.warn("Login failed — missing email or password");
            return res
                .status(400)
                .json({ message: "Please provide email and password" });
        }

        // Find user and explicitly select password (it's excluded by default)
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            logger.warn(`Login failed — user not found: ${email}`);
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare passwords
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn(`Login failed — wrong password for: ${email}`);
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate token & respond
        const token = generateToken(user._id);
        logger.info(`User logged in successfully: ${user._id} (${email})`);
        return res.status(200).json(buildAuthResponse(user, token));
    } catch (error) {
        logger.error(`Login error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error during login" });
    }
};

// ─── GET /auth/me  (protected) ──────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const user = req.user;
        logger.info(`GetMe requested by user: ${user._id}`);
        return res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
        });
    } catch (error) {
        logger.error(`GetMe error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error" });
    }
};

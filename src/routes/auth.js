const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const protect = require("../middlewares/auth");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected route (requires valid JWT)
router.get("/me", protect, authController.getMe);

module.exports = router;

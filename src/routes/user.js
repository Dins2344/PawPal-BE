const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");
const protect = require("../middlewares/auth");

// Public route
userRouter.get("/", (req, res) => {
    res.send("User route");
});

// Protected route — confirm adoption
userRouter.post("/adopt", protect, userController.confirmAdoption);

module.exports = userRouter;
const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");
const protect = require("../middlewares/auth");

// Public route
userRouter.get("/", (req, res) => {
    res.send("User route");
});

// Protected routes
userRouter.post("/adopt", protect, userController.confirmAdoption);
userRouter.get("/adoptions", protect, userController.getUserAdoptions);
userRouter.delete("/adoptions/:adoptionId", protect, userController.withdrawAdoption);

module.exports = userRouter;
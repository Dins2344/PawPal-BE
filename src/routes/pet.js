const express = require("express");
const router = express.Router();
const petController = require("../controllers/petController");

// Public routes — no auth required
router.get("/breeds", petController.getPetBreeds); // Must come BEFORE /:id
router.get("/", petController.getAllPets);
router.get("/:id", petController.getPetById);

module.exports = router;

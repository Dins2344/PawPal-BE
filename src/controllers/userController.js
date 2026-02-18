const Adoption = require("../models/Adoption");
const Pet = require("../models/Pet");
const logger = require("../utils/logger");

// ─── POST /users/adopt — Confirm Adoption ───────────────────────────────────
exports.confirmAdoption = async (req, res) => {
    try {
        const userId = req.user._id;
        const { petId } = req.body;

        if (!petId) {
            logger.warn(`Adoption failed — no petId provided by user: ${userId}`);
            return res.status(400).json({ message: "Pet ID is required" });
        }

        // Check if pet exists
        const pet = await Pet.findById(petId);
        if (!pet) {
            logger.warn(`Adoption failed — pet not found: ${petId}`);
            return res.status(404).json({ message: "Pet not found" });
        }

        // Check if pet is already adopted
        if (pet.isAdopted) {
            logger.warn(`Adoption failed — pet already adopted: ${petId}`);
            return res.status(400).json({ message: "This pet has already been adopted" });
        }

        // Check if user already has a pending/confirmed adoption for this pet
        const existingAdoption = await Adoption.findOne({
            user: userId,
            pet: petId,
            status: { $in: ["pending", "confirmed"] },
        });

        if (existingAdoption) {
            logger.warn(`Adoption failed — duplicate request by user: ${userId} for pet: ${petId}`);
            return res
                .status(400)
                .json({ message: "You have already adopted or requested this pet" });
        }

        // Create adoption record
        const adoption = await Adoption.create({
            user: userId,
            pet: petId,
            status: "confirmed",
        });

        // Mark pet as adopted
        pet.isAdopted = true;
        await pet.save();

        // Populate pet details in the response
        await adoption.populate("pet");

        logger.info(`Adoption confirmed — user: ${userId}, pet: ${petId}, adoption: ${adoption._id}`);

        return res.status(201).json({
            message: "Adoption confirmed successfully",
            adoption: {
                _id: adoption._id,
                pet: adoption.pet,
                status: adoption.status,
                adoptedAt: adoption.adoptedAt,
            },
        });
    } catch (error) {
        logger.error(`Adoption error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error during adoption" });
    }
};

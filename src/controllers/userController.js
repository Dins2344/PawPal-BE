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
        if (pet.status === "adopted") {
            logger.warn(`Adoption failed — pet already adopted: ${petId}`);
            return res.status(400).json({ message: "This pet has already been adopted" });
        }

        // Check if user already has a pending/approved adoption for this pet
        const existingAdoption = await Adoption.findOne({
            user: userId,
            pet: petId,
            status: { $in: ["pending", "approved"] },
        });

        if (existingAdoption) {
            logger.warn(`Adoption failed — duplicate request by user: ${userId} for pet: ${petId}`);
            return res
                .status(400)
                .json({ message: "You have already adopted or requested this pet" });
        }

        // Create adoption record (status: pending — admin will approve/reject)
        const adoption = await Adoption.create({
            user: userId,
            pet: petId,
            status: "pending",
        });

        // Mark pet as pending
        pet.status = "pending";
        await pet.save();

        // Populate pet details in the response
        await adoption.populate("pet");

        logger.info(`Adoption request created — user: ${userId}, pet: ${petId}, adoption: ${adoption._id}`);

        return res.status(201).json({
            message: "Adoption request submitted successfully",
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

// ─── GET /users/adoptions — Get User Adoptions ──────────────────────────────
exports.getUserAdoptions = async (req, res) => {
    try {
        const userId = req.user._id;
        logger.info(`Fetching adoptions for user: ${userId}`);

        const adoptions = await Adoption.find({ user: userId })
            .populate("pet")
            .sort({ createdAt: -1 });

        logger.info(`Fetched ${adoptions.length} adoptions for user: ${userId}`);
        return res.status(200).json(adoptions); // Frontend expects array directly
    } catch (error) {
        logger.error(`Get user adoptions error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error while fetching adoptions" });
    }
};

// ─── DELETE /users/adoptions/:adoptionId — Withdraw Adoption ────────────────
exports.withdrawAdoption = async (req, res) => {
    try {
        const userId = req.user._id;
        const { adoptionId } = req.params;

        logger.info(`User ${userId} withdrawing adoption: ${adoptionId}`);

        const adoption = await Adoption.findOne({ _id: adoptionId, user: userId });

        if (!adoption) {
            logger.warn(`Withdraw failed — adoption not found or unauthorized: ${adoptionId}`);
            return res.status(404).json({ message: "Adoption request not found" });
        }

        if (adoption.status === "approved") {
            logger.warn(`Withdraw failed — cannot withdraw approved adoption: ${adoptionId}`);
            return res
                .status(400)
                .json({ message: "Cannot withdraw an approved adoption. Please contact admin." });
        }

        // If pending, revert pet status to available
        if (adoption.status === "pending") {
            await Pet.findByIdAndUpdate(adoption.pet, { status: "available" });
            logger.info(`Reverted pet status to available for adoption: ${adoptionId}`);
        }

        // Delete the adoption record
        await Adoption.findByIdAndDelete(adoptionId);

        logger.info(`Adoption withdrawn successfully: ${adoptionId}`);
        return res.status(200).json({ message: "Adoption request withdrawn successfully" });
    } catch (error) {
        logger.error(`Withdraw adoption error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error while withdrawing adoption" });
    }
};

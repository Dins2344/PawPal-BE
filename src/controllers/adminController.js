const Pet = require("../models/Pet");
const Adoption = require("../models/Adoption");
const logger = require("../utils/logger");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const { sendAdoptionEmail } = require("../utils/emailService");

// ═══════════════════════════════════════════════════════════════════════════
//  PET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// ─── POST /admin/pets — Add a new pet ───────────────────────────────────────
exports.addPet = async (req, res) => {
    try {
        const { name, breed, age, species, gender, description } = req.body;

        logger.info(`Admin adding new pet: ${name}`);

        const petData = {
            name,
            breed,
            age,
            species,
            gender,
            description,
        };

        // If image was uploaded, upload to Cloudinary
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            petData.image = result.secure_url;
            petData.imagePublicId = result.public_id;
            logger.debug(`Image uploaded to Cloudinary: ${result.public_id}`);
        }

        const pet = await Pet.create(petData);

        logger.info(`Pet added successfully: ${pet._id} (${name})`);

        return res.status(201).json({
            message: "Pet added successfully",
            pet,
        });
    } catch (error) {
        logger.error(`Add pet error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error while adding pet" });
    }
};

// ─── GET /admin/pets — Get all pets ─────────────────────────────────────────
exports.getAllPets = async (req, res) => {
    try {
        logger.info("Admin fetching all pets");

        const pets = await Pet.find().sort({ createdAt: -1 });

        logger.info(`Fetched ${pets.length} pets`);
        return res.status(200).json(pets);
    } catch (error) {
        logger.error(`Get pets error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error while fetching pets" });
    }
};

// ─── PUT /admin/pets/:petId — Edit a pet ──────────────────────────────────
exports.updatePet = async (req, res) => {
    try {
        const { petId } = req.params;
        const { name, breed, age, species, gender, description, status } = req.body;

        logger.info(`Admin updating pet: ${petId}`);

        const pet = await Pet.findById(petId);
        if (!pet) {
            logger.warn(`Update failed — pet not found: ${petId}`);
            return res.status(404).json({ message: "Pet not found" });
        }

        // Updating fields
        if (name) pet.name = name;
        if (breed) pet.breed = breed;
        if (age) pet.age = age;
        if (species) pet.species = species;
        if (gender) pet.gender = gender;
        if (description) pet.description = description;
        if (status) pet.status = status;

        // If new image uploaded: remove old image & upload new one
        if (req.file) {
            if (pet.imagePublicId) {
                await deleteFromCloudinary(pet.imagePublicId);
                logger.debug(`Deleted old image for update: ${pet.imagePublicId}`);
            }

            const result = await uploadToCloudinary(req.file.buffer);
            pet.image = result.secure_url;
            pet.imagePublicId = result.public_id;
            logger.debug(`New image uploaded for update: ${result.public_id}`);
        }

        await pet.save();

        logger.info(`Pet updated successfully: ${petId}`);
        return res.status(200).json({
            message: "Pet updated successfully",
            pet,
        });
    } catch (error) {
        logger.error(`Update pet error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error while updating pet" });
    }
};

// ─── DELETE /admin/pets/:petId — Delete a pet ───────────────────────────────
exports.deletePet = async (req, res) => {
    try {
        const { petId } = req.params;

        logger.info(`Admin deleting pet: ${petId}`);

        const pet = await Pet.findById(petId);
        if (!pet) {
            logger.warn(`Delete failed — pet not found: ${petId}`);
            return res.status(404).json({ message: "Pet not found" });
        }

        // Delete image from Cloudinary if it exists
        if (pet.imagePublicId) {
            await deleteFromCloudinary(pet.imagePublicId);
            logger.debug(`Deleted image from Cloudinary: ${pet.imagePublicId}`);
        }

        await Pet.findByIdAndDelete(petId);

        // Also remove any adoption records for this pet
        await Adoption.deleteMany({ pet: petId });

        logger.info(`Pet deleted successfully: ${petId}`);
        return res.status(200).json({ message: "Pet deleted successfully" });
    } catch (error) {
        logger.error(`Delete pet error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error while deleting pet" });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
//  ADOPTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// ─── GET /admin/adoptions — Get all adoption requests ───────────────────────
exports.getAdoptionRequests = async (req, res) => {
    try {
        logger.info("Admin fetching adoption requests");

        const adoptions = await Adoption.find()
            .populate("user", "fullName email phone")
            .populate("pet", "name breed image")
            .sort({ createdAt: -1 });

        logger.info(`Fetched ${adoptions.length} adoption requests`);
        return res.status(200).json(adoptions);
    } catch (error) {
        logger.error(`Get adoptions error: ${error.message}`, { stack: error.stack });
        return res
            .status(500)
            .json({ message: "Server error while fetching adoptions" });
    }
};

// ─── PUT /admin/adoptions/:adoptionId/approve — Approve an adoption ─────────
exports.approveAdoption = async (req, res) => {
    try {
        const { adoptionId } = req.params;

        logger.info(`Admin approving adoption: ${adoptionId}`);

        const adoption = await Adoption.findById(adoptionId)
            .populate("user", "fullName email")
            .populate("pet", "name");
        if (!adoption) {
            logger.warn(`Approve failed — adoption not found: ${adoptionId}`);
            return res.status(404).json({ message: "Adoption request not found" });
        }

        if (adoption.status !== "pending") {
            logger.warn(
                `Approve failed — adoption already ${adoption.status}: ${adoptionId}`
            );
            return res
                .status(400)
                .json({ message: `Adoption already ${adoption.status}` });
        }

        // Update adoption status
        adoption.status = "approved";
        adoption.adoptedAt = new Date();
        await adoption.save();

        // Mark pet as adopted
        await Pet.findByIdAndUpdate(adoption.pet._id, { status: "adopted" });

        // Send approval email to user
        sendAdoptionEmail({
            toEmail: adoption.user.email,
            toName: adoption.user.fullName,
            petName: adoption.pet.name,
            status: "approved",
        });

        logger.info(`Adoption approved: ${adoptionId}`);
        return res.status(200).json({ message: "Adoption approved successfully" });
    } catch (error) {
        logger.error(`Approve adoption error: ${error.message}`, {
            stack: error.stack,
        });
        return res
            .status(500)
            .json({ message: "Server error while approving adoption" });
    }
};

// ─── PUT /admin/adoptions/:adoptionId/reject — Reject an adoption ───────────
exports.rejectAdoption = async (req, res) => {
    try {
        const { adoptionId } = req.params;

        logger.info(`Admin rejecting adoption: ${adoptionId}`);

        const adoption = await Adoption.findById(adoptionId)
            .populate("user", "fullName email")
            .populate("pet", "name");
        if (!adoption) {
            logger.warn(`Reject failed — adoption not found: ${adoptionId}`);
            return res.status(404).json({ message: "Adoption request not found" });
        }

        if (adoption.status !== "pending") {
            logger.warn(
                `Reject failed — adoption already ${adoption.status}: ${adoptionId}`
            );
            return res
                .status(400)
                .json({ message: `Adoption already ${adoption.status}` });
        }

        // Update adoption status
        adoption.status = "rejected";
        await adoption.save();

        // Make pet available again
        await Pet.findByIdAndUpdate(adoption.pet._id, { status: "available" });

        // Send rejection email to user
        sendAdoptionEmail({
            toEmail: adoption.user.email,
            toName: adoption.user.fullName,
            petName: adoption.pet.name,
            status: "rejected",
        });

        logger.info(`Adoption rejected: ${adoptionId}`);
        return res.status(200).json({ message: "Adoption rejected successfully" });
    } catch (error) {
        logger.error(`Reject adoption error: ${error.message}`, {
            stack: error.stack,
        });
        return res
            .status(500)
            .json({ message: "Server error while rejecting adoption" });
    }
};

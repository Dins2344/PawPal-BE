const Pet = require("../models/Pet");
const logger = require("../utils/logger");

// ─── GET /api/pets/breeds — Get unique breeds ──────────────────────────────
exports.getPetBreeds = async (req, res) => {
    try {
        logger.info("Fetching unique pet breeds");

        // Use MongoDB distinct to get unique values
        const breeds = await Pet.distinct("breed");

        logger.info(`Found ${breeds.length} unique breeds`);
        return res.status(200).json(breeds);
    } catch (error) {
        logger.error(`Get breeds error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error while fetching breeds" });
    }
};

// ─── GET /api/pets — Get all pets (with optional filters) ───────────────────
exports.getAllPets = async (req, res) => {
    try {
        const { search, species, breed, age } = req.query;
        const filter = { status: { $ne: "adopted" } };

        // Filter by species
        if (species) {
            filter.species = species;
        }

        // Filter by age (exact match)
        if (age) {
            filter.age = age;
        }

        // Filter by breed (case-insensitive partial match)
        if (breed) {
            filter.breed = { $regex: breed, $options: "i" };
        }

        // Search by name or breed (case-insensitive partial match)
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { breed: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        logger.info(`Fetching pets with filters: ${JSON.stringify(filter)}`);

        const pets = await Pet.find(filter).sort({ createdAt: -1 });

        logger.info(`Found ${pets.length} pets`);
        return res.status(200).json(pets);
    } catch (error) {
        logger.error(`Get all pets error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error while fetching pets" });
    }
};

// ─── GET /api/pets/:id — Get a single pet by ID ────────────────────────────
exports.getPetById = async (req, res) => {
    try {
        const { id } = req.params;

        logger.info(`Fetching pet by ID: ${id}`);

        const pet = await Pet.findById(id);
        if (!pet) {
            logger.warn(`Pet not found: ${id}`);
            return res.status(404).json({ message: "Pet not found" });
        }

        return res.status(200).json(pet);
    } catch (error) {
        logger.error(`Get pet by ID error: ${error.message}`, { stack: error.stack });
        return res.status(500).json({ message: "Server error while fetching pet" });
    }
};

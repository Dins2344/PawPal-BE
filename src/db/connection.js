const mongoose = require("mongoose");
const logger = require("../utils/logger");

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info("Connected to MongoDB successfully");
    } catch (error) {
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectToDatabase; 
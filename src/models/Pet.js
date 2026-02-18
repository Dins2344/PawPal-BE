const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Pet name is required"],
            trim: true,
        },
        breed: {
            type: String,
            required: [true, "Breed is required"],
            trim: true,
        },
        age: {
            type: Number,
            required: [true, "Age is required"],
        },
        species: {
            type: String,
            enum: ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"],
            required: [true, "Species is required"],
        },
        gender: {
            type: String,
            enum: ["Male", "Female"],
            required: [true, "Gender is required"],
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        imagePublicId: {
            type: String,
        },
        status: {
            type: String,
            enum: ["available", "adopted", "pending"],
            default: "available",
        },
    },
    { timestamps: true }
);

const Pet = mongoose.model("Pet", petSchema);

module.exports = Pet;

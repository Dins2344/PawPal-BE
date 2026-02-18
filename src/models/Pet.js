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
            enum: ["dog", "cat", "bird", "rabbit", "other"],
            required: [true, "Species is required"],
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        isAdopted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Pet = mongoose.model("Pet", petSchema);

module.exports = Pet;

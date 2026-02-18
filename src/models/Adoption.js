const mongoose = require("mongoose");

const adoptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        pet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pet",
            required: [true, "Pet is required"],
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "confirmed",
        },
        adoptedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const Adoption = mongoose.model("Adoption", adoptionSchema);

module.exports = Adoption;

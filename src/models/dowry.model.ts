import mongoose from "mongoose";

const dowrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    dowryCategory: {
        type: String,
        required: true,
    },
    dowryPrice: {
        type: Number,
        required: true,
    },
    dowryImage: {
        type: String,
        required: true,
    },
    dowryLocation: {
        type: String,
        required: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

export const Dowry = mongoose.model("Dowry", dowrySchema);

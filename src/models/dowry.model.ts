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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
        required: true,
        // Reference to Image model for GridFS storage
    },
    dowryLocation: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['purchased', 'not_purchased'],
        default: 'not_purchased',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

export const Dowry = mongoose.model("Dowry", dowrySchema);

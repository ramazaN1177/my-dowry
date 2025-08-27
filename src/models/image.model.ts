import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    contentType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    dowryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dowry',
        required: false, // Optional, can be linked later
    },
    gridfsId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    }
}, { timestamps: true });

export const Image = mongoose.model("Image", imageSchema);

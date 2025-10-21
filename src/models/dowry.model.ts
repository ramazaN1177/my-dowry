import mongoose from "mongoose";

const dowrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
   Category:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
   },
    dowryPrice: {
        type: Number,
        required: false,
    },
    dowryImage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
        required: false,
        // Reference to Image model for GridFS storage
    },
    dowryLocation: {
        type: String,
        required: false,
    },
    url: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['purchased', 'not_purchased'],
        default: 'not_purchased',
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
        required: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

export const Dowry = mongoose.model("Dowry", dowrySchema);

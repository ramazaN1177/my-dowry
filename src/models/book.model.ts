import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    author:{
        type: String,
        required:true,
    },
    Category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
       },
    status:{
        type: String,
        enum: ["purchased", "not_purchased"],
        default: "not_purchased",
        required: true,
    },
    isRead:{
        type: Boolean,
        default: false,
        required: false,
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }

}, { timestamps: true });

export const Book = mongoose.model("Book", bookSchema);
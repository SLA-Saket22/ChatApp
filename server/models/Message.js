import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String },
    image: { type: String },
    file: {
        url: { type: String },
        name: { type: String },
        type: { type: String }, // "pdf", "doc", "image", etc.
        size: { type: Number },
    },
    seen: { type: Boolean, default: false },
    isImportant: { type: Boolean, default: false }, // flagged by AI/keyword
    reminder: { type: mongoose.Schema.Types.ObjectId, ref: "Reminder" },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
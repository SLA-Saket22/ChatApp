import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    text: { type: String, required: true },
    type: { type: String, enum: ["exam", "deadline", "submission", "meeting", "other"], default: "other" },
    date: { type: Date },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Reminder", reminderSchema);
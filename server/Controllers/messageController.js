import Message from "../models/Message.js";
import User from "../models/User.js";
import Reminder from "../models/Reminder.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { detectReminder } from "../lib/reminderDetector.js";
import { summarizeMessages } from "../lib/aiSummary.js";
import multer from "multer";
import path from "path";

// Multer config — memory storage, then upload to cloudinary
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|doc|docx|txt|png|jpg|jpeg|gif|mp4|zip/;
        const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
        allowed.test(ext) ? cb(null, true) : cb(new Error("File type not allowed"));
    },
});

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        const unseenMessage = {};
        await Promise.all(filteredUsers.map(async (user) => {
            const count = await Message.countDocuments({ senderId: user._id, receiverId: userId, seen: false });
            if (count > 0) unseenMessage[user._id] = count;
        }));

        res.json({ success: true, users: filteredUsers, unseenMessage });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getMessage = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
        }).populate("senderId", "fullName profilePic");

        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId, seen: false },
            { seen: true }
        );

        const senderSocketId = userSocketMap[selectedUserId];
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesSeen", { by: myId.toString() });
        }

        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findByIdAndUpdate(id, { seen: true }, { new: true });

        const senderSocketId = userSocketMap[message.senderId.toString()];
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageSeen", { messageId: id });
        }

        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploaded = await cloudinary.uploader.upload(image);
            imageUrl = uploaded.secure_url;
        }

        // Handle file upload
        let fileData;
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            const dataUri = `data:${req.file.mimetype};base64,${b64}`;
            const uploaded = await cloudinary.uploader.upload(dataUri, {
                resource_type: "auto",
                folder: "chat_files",
            });
            fileData = {
                url: uploaded.secure_url,
                name: req.file.originalname,
                type: path.extname(req.file.originalname).replace(".", "").toLowerCase(),
                size: req.file.size,
            };
        }

        // Detect reminder from text
        let reminderId = null;
        let isImportant = false;

        if (text) {
            const detected = detectReminder(text);
            if (detected) {
                isImportant = true;
                const reminder = await Reminder.create({
                    userId: receiverId,
                    text,
                    type: detected.type,
                    date: detected.date,
                });
                reminderId = reminder._id;

                // Notify receiver about reminder
                const receiverSocketId = userSocketMap[receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newReminder", reminder);
                }
            }
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            file: fileData,
            isImportant,
            reminder: reminderId,
        });

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        const senderSocketId = userSocketMap[senderId.toString()];
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageDelivered", {
                messageId: newMessage._id.toString(),
            });
        }

        res.json({ success: true, newMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Search messages
export const searchMessages = async (req, res) => {
    try {
        const { query } = req.query;
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        if (!query?.trim()) return res.json({ success: true, messages: [] });

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
            text: { $regex: query.trim(), $options: "i" },
        }).populate("senderId", "fullName");

        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// AI Summary
export const getChatSummary = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("senderId", "fullName");

        const textMessages = messages.filter(m => m.text);

        if (textMessages.length < 2) {
            return res.json({ success: true, summary: "Not enough messages to summarize yet." });
        }

        const summary = await summarizeMessages(messages.reverse());
        res.json({ success: true, summary });
    } catch (error) {
        console.error("Summary route error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get reminders
export const getReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.user._id })
            .sort({ date: 1 });
        res.json({ success: true, reminders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Mark reminder as read
export const markReminderRead = async (req, res) => {
    try {
        await Reminder.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get only important messages
export const getImportantMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
            isImportant: true,
        }).populate("senderId", "fullName profilePic");

        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    getUsersForSidebar,
    getMessage,
    sendMessage,
    markMessageAsSeen,
    searchMessages,
    getChatSummary,
    getReminders,
    markReminderRead,
    getImportantMessages,
    upload,
} from "../Controllers/messageController.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/reminders", protectRoute, getReminders);
router.get("/:id", protectRoute, getMessage);
router.get("/:id/search", protectRoute, searchMessages);
router.get("/:id/summary", protectRoute, getChatSummary);
router.get("/:id/important", protectRoute, getImportantMessages);
router.post("/send/:id", protectRoute, upload.single("file"), sendMessage);
router.put("/mark/:id", protectRoute, markMessageAsSeen);
router.put("/reminder/:id/read", protectRoute, markReminderRead);

export default router;
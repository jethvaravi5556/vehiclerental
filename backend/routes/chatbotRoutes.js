// ---------- routes/chatbotRoutes.js ----------
import express from "express";
import { chatbotController } from "../controllers/chatbotController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/chat", authenticate, chatbotController);
export default router;
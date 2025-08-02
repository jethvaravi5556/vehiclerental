// ---------- routes/bookingRoutes.js ----------
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  completeBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", authenticate, createBooking);
router.get("/my", authenticate, getMyBookings);
router.put("/cancel/:id", authenticate, cancelBooking);
router.put("/complete/:id", authenticate, completeBooking);

export default router;

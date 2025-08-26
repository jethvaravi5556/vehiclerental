import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  completeBooking,
  checkVehicleAvailability, // ✅ NEW ROUTE
} from "../controllers/bookingController.js";

const router = express.Router();

// ✅ NEW ROUTE: Check vehicle availability
router.get("/check-availability", checkVehicleAvailability);

router.post("/", authenticate, createBooking);
router.get("/my", authenticate, getMyBookings);
router.put("/cancel/:id", authenticate, cancelBooking);
router.put("/complete/:id", authenticate, completeBooking);

export default router;
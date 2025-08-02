import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import multer from 'multer';
import {
  getAllUsers,
  changeUserRole,
  getAllBookings,
  addUser,
  updateUser,
  deleteUser,
  sendInvoiceEmail
} from "../controllers/adminController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });
router.get("/users", authenticate, authorizeRoles("admin"), getAllUsers);
router.post("/users", authenticate, authorizeRoles("admin"), addUser);
router.put("/users/:id", authenticate, authorizeRoles("admin"), updateUser);
router.delete("/users/:id", authenticate, authorizeRoles("admin"), deleteUser);
router.put("/users/:id/role", authenticate, authorizeRoles("admin"), changeUserRole);

router.get("/bookings", authenticate, authorizeRoles("admin"), getAllBookings);


// POST /api/admin/send-invoice-email
router.post('/send-invoice-email', upload.single('invoice'), sendInvoiceEmail);

export default router;

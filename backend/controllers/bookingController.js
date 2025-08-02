// ---------- controllers/bookingController.js ----------
import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";

const isTimeOverlap = (start1, end1, start2, end2) => {
  return !(end1 <= start2 || start1 >= end2);
};

// ✅ Create a new booking
export const createBooking = async (req, res) => {
  try {
    const {
      vehicleId,
      bookingType,
      startDate,
      endDate,
      startHour,
      endHour,
      pickupLocation,
      dropLocation,
    } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    let amountPaid = 0;

    // Get confirmed bookings for this vehicle
    const existingBookings = await Booking.find({
      vehicle: vehicleId,
      status: "confirmed",
    });

    if (bookingType === "daily") {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

      for (const booking of existingBookings) {
        if (booking.bookingType !== "daily") continue;

        const bStart = new Date(booking.startDate);
        const bEnd = new Date(booking.endDate);
        if (isTimeOverlap(start, end, bStart, bEnd)) {
          return res.status(409).json({ message: "Vehicle already booked for these dates" });
        }
      }

      amountPaid = diffInDays * vehicle.pricePerDay;
    } else if (bookingType === "hourly") {
      const [startH, startM] = startHour.split(":").map(Number);
      const [endH, endM] = endHour.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes >= endMinutes) {
        return res.status(400).json({ message: "Invalid hourly time range" });
      }

      for (const booking of existingBookings) {
        if (booking.bookingType !== "hourly") continue;

        const [bStartH, bStartM] = booking.startHour.split(":").map(Number);
        const [bEndH, bEndM] = booking.endHour.split(":").map(Number);
        const bStart = bStartH * 60 + bStartM;
        const bEnd = bEndH * 60 + bEndM;

        if (isTimeOverlap(startMinutes, endMinutes, bStart, bEnd)) {
          return res.status(409).json({ message: "Vehicle already booked for these hours" });
        }
      }

      const diffHours = Math.ceil((endMinutes - startMinutes) / 60);
      amountPaid = diffHours * vehicle.pricePerHour;
    } else {
      return res.status(400).json({ message: "Invalid booking type" });
    }

    // ✅ Create booking
    const booking = await Booking.create({
      user: req.user._id,
      vehicle: vehicleId,
      bookingType,
      startDate,
      endDate,
      startHour,
      endHour,
      pickupLocation,
      dropLocation,
      amountPaid,
    });

    // ✅ Mark vehicle as unavailable
    await Vehicle.findByIdAndUpdate(vehicleId, { available: false });

    res.status(201).json(booking);
  } catch (error) {
    console.error("Booking creation failed", error);
    res.status(500).json({ message: "Failed to create booking" });
  }
};

// ✅ Get all bookings for current user
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate("vehicle");
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// ✅ Cancel a booking
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    if (booking) {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { available: true });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error cancelling booking", error);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
};

// ✅ Mark booking as completed
export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true }
    );

    if (booking) {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { available: true });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error completing booking", error);
    res.status(500).json({ message: "Failed to complete booking" });
  }
};

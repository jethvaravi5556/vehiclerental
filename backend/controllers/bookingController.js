import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";

const isTimeOverlap = (start1, end1, start2, end2) => {
  return !(end1 <= start2 || start1 >= end2);
};

// ✅ Enhanced availability check function
export const checkVehicleAvailability = async (req, res) => {
  try {
    const {
      vehicleId,
      bookingType,
      startDate,
      endDate,
      startHour,
      endHour,
    } = req.query;

    if (!vehicleId || !bookingType) {
      return res.status(400).json({ 
        message: "Vehicle ID and booking type are required",
        available: false 
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ 
        message: "Vehicle not found",
        available: false 
      });
    }

    // Check if vehicle is generally available
    if (!vehicle.available) {
      return res.json({ 
        available: false, 
        message: "Vehicle is currently not available",
        reason: "vehicle_unavailable"
      });
    }

    const existingBookings = await Booking.find({
      vehicle: vehicleId,
      status: "confirmed",
    });

    let isAvailable = true;
    let conflictingBooking = null;

    if (bookingType === "daily") {
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          message: "Start and end dates are required for daily booking",
          available: false 
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      for (const booking of existingBookings) {
        if (booking.bookingType !== "daily") continue;

        const bStart = new Date(booking.startDate);
        const bEnd = new Date(booking.endDate);
        
        if (isTimeOverlap(start, end, bStart, bEnd)) {
          isAvailable = false;
          conflictingBooking = {
            id: booking._id,
            startDate: booking.startDate,
            endDate: booking.endDate,
            bookingType: booking.bookingType
          };
          break;
        }
      }
    } else if (bookingType === "hourly") {
      if (!startHour || !endHour || !startDate) {
        return res.status(400).json({ 
          message: "Date, start time and end time are required for hourly booking",
          available: false 
        });
      }

      const [startH, startM] = startHour.split(":").map(Number);
      const [endH, endM] = endHour.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes >= endMinutes) {
        return res.status(400).json({ 
          message: "Invalid time range",
          available: false 
        });
      }

      for (const booking of existingBookings) {
        if (booking.bookingType !== "hourly") continue;

        // Check if it's the same date
        const bookingDate = new Date(booking.startDate).toDateString();
        const requestDate = new Date(startDate).toDateString();
        
        if (bookingDate !== requestDate) continue;

        const [bStartH, bStartM] = booking.startHour.split(":").map(Number);
        const [bEndH, bEndM] = booking.endHour.split(":").map(Number);
        const bStart = bStartH * 60 + bStartM;
        const bEnd = bEndH * 60 + bEndM;

        if (isTimeOverlap(startMinutes, endMinutes, bStart, bEnd)) {
          isAvailable = false;
          conflictingBooking = {
            id: booking._id,
            startDate: booking.startDate,
            startHour: booking.startHour,
            endHour: booking.endHour,
            bookingType: booking.bookingType
          };
          break;
        }
      }
    }

    res.json({
      available: isAvailable,
      message: isAvailable 
        ? "Vehicle is available for the selected time" 
        : "Vehicle is already booked for the selected time",
      reason: isAvailable ? null : "time_conflict",
      conflictingBooking: conflictingBooking,
      vehicleDetails: {
        id: vehicle._id,
        title: vehicle.title,
        pricePerDay: vehicle.pricePerDay,
        pricePerHour: vehicle.pricePerHour
      }
    });

  } catch (error) {
    console.error("Availability check failed", error);
    res.status(500).json({ 
      message: "Failed to check availability",
      available: false 
    });
  }
};

// ✅ Create a new booking with enhanced validation
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

    if (!vehicle.available) {
      return res.status(409).json({ 
        message: "Vehicle is not available for booking",
        reason: "vehicle_unavailable"
      });
    }

    let amountPaid = 0;

    // Double-check availability before creating booking
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
          return res.status(409).json({ 
            message: "Vehicle already booked for these dates",
            reason: "time_conflict",
            conflictingBooking: {
              startDate: booking.startDate,
              endDate: booking.endDate
            }
          });
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

        // Check if it's the same date
        const bookingDate = new Date(booking.startDate).toDateString();
        const requestDate = new Date(startDate).toDateString();
        
        if (bookingDate !== requestDate) continue;

        const [bStartH, bStartM] = booking.startHour.split(":").map(Number);
        const [bEndH, bEndM] = booking.endHour.split(":").map(Number);
        const bStart = bStartH * 60 + bStartM;
        const bEnd = bEndH * 60 + bEndM;

        if (isTimeOverlap(startMinutes, endMinutes, bStart, bEnd)) {
          return res.status(409).json({ 
            message: "Vehicle already booked for these hours",
            reason: "time_conflict",
            conflictingBooking: {
              startDate: booking.startDate,
              startHour: booking.startHour,
              endHour: booking.endHour
            }
          });
        }
      }

      const diffHours = Math.ceil((endMinutes - startMinutes) / 60);
      amountPaid = diffHours * vehicle.pricePerHour;
    } else {
      return res.status(400).json({ message: "Invalid booking type" });
    }

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
      status: "confirmed"
    });

    // Populate vehicle details for response
    await booking.populate('vehicle');

    res.status(201).json({
      success: true,
      booking,
      message: "Booking created successfully"
    });
  } catch (error) {
    console.error("Booking creation failed", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create booking" 
    });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("vehicle")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status: "cancelled",
        cancelledAt: new Date()
      },
      { new: true }
    ).populate('vehicle');

    res.json({
      success: true,
      booking: updatedBooking,
      message: "Booking cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling booking", error);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
};

export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status: "completed",
        completedAt: new Date()
      },
      { new: true }
    ).populate('vehicle');

    res.json({
      success: true,
      booking,
      message: "Booking completed successfully"
    });
  } catch (error) {
    console.error("Error completing booking", error);
    res.status(500).json({ message: "Failed to complete booking" });
  }
};
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  CreditCard,
  ArrowLeft,
  Clock,
  Car,
  Star,
  Shield,
  Check,
  Zap,
  Award,
  CheckCircle,
  AlertCircle,
  Users,
  Fuel,
  Settings,
  Phone,
  MessageCircle,
  HeadphonesIcon,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Loader,
  Info,
  Ban,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useVehicle } from "../contexts/VehicleContext";
import { useBooking } from "../contexts/BookingContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
const BookingPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get("vehicleId");

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [lastCheckedBooking, setLastCheckedBooking] = useState(null);

  // Enhanced URL params extraction
  const urlPickupDate = searchParams.get("pickupDate");
  const urlReturnDate = searchParams.get("returnDate");
  const urlPickupTime = searchParams.get("pickupTime");
  const urlReturnTime = searchParams.get("returnTime");
  const urlLocation = searchParams.get("location");
  const urlBookingType = searchParams.get("bookingType");

  // Determine booking type from URL params
  const getInitialBookingType = () => {
    if (urlBookingType === "hourly" || (urlPickupTime && urlReturnTime)) {
      return "hourly";
    }
    return "daily";
  };

  const [bookingData, setBookingData] = useState({
    startDate: urlPickupDate || "",
    endDate: urlReturnDate || "",
    startHour: urlPickupTime || "",
    endHour: urlReturnTime || "",
    pickupLocation: urlLocation || "",
    dropLocation: urlLocation || "",
    bookingType: getInitialBookingType(),
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [prefillNotified, setPrefillNotified] = useState(false);
  const [showConflictDetails, setShowConflictDetails] = useState(false);

  const { getVehicleById } = useVehicle();
  const {
    createBooking,
    loading: bookingLoading,
    checkVehicleAvailability,
    getCachedAvailability,
    clearAvailabilityCache,
    conflictDetails,
    getAlternativeSuggestions,
  } = useBooking();

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId]);

  useEffect(() => {
    calculateTotal();
    validateBooking();
  }, [bookingData, vehicle]);

  // Enhanced real-time availability checking with debouncing
  useEffect(() => {
    if (vehicle && vehicleId && bookingData.startDate) {
      const bookingKey = getBookingKey(bookingData);

      // Only check if booking data has actually changed
      if (bookingKey !== lastCheckedBooking) {
        const timeoutId = setTimeout(() => {
          checkAvailabilityForCurrentBooking();
          setLastCheckedBooking(bookingKey);
        }, 1000); // 1 second debounce

        return () => clearTimeout(timeoutId);
      }
    }
  }, [bookingData, vehicle, vehicleId]);

  // Enhanced notification for pre-filled data
  useEffect(() => {
    if (
      !prefillNotified &&
      (urlPickupDate ||
        urlReturnDate ||
        urlLocation ||
        urlPickupTime ||
        urlReturnTime)
    ) {
      let message = "Booking form pre-filled with your search details";
      let details = [];

      if (bookingData.bookingType === "hourly") {
        if (urlPickupDate) {
          details.push(`Date: ${new Date(urlPickupDate).toLocaleDateString()}`);
        }
        if (urlPickupTime && urlReturnTime) {
          details.push(`Time: ${urlPickupTime} to ${urlReturnTime}`);
        }
        if (urlLocation) {
          details.push(`Location: ${urlLocation}`);
        }
      } else {
        if (urlPickupDate && urlReturnDate) {
          details.push(
            `${new Date(urlPickupDate).toLocaleDateString()} to ${new Date(
              urlReturnDate
            ).toLocaleDateString()}`
          );
        }
        if (urlLocation) {
          details.push(`in ${urlLocation}`);
        }
      }

      if (details.length > 0) {
        message += ` (${details.join(", ")})`;
      }

      toast.success(message, {
        icon: bookingData.bookingType === "hourly" ? "⏰" : "📅",
        duration: 5000,
        style: {
          borderRadius: "10px",
          background:
            bookingData.bookingType === "hourly" ? "#8B5CF6" : "#10B981",
          color: "#fff",
        },
      });
      setPrefillNotified(true);
    }
  }, [
    urlPickupDate,
    urlReturnDate,
    urlLocation,
    urlPickupTime,
    urlReturnTime,
    prefillNotified,
    bookingData.bookingType,
  ]);

  // Create unique booking key for comparison
  const getBookingKey = (booking) => {
    return `${booking.bookingType}-${booking.startDate}-${booking.endDate}-${booking.startHour}-${booking.endHour}`;
  };

  // Enhanced availability checking
  const checkAvailabilityForCurrentBooking = useCallback(async () => {
    if (!vehicle || !vehicleId) return;

    // Check if we have enough data for availability check
    if (bookingData.bookingType === "daily") {
      if (!bookingData.startDate || !bookingData.endDate) return;
    } else if (bookingData.bookingType === "hourly") {
      if (
        !bookingData.startDate ||
        !bookingData.startHour ||
        !bookingData.endHour
      )
        return;
    }

    // Check if dates/times are valid
    if (bookingData.bookingType === "daily") {
      if (new Date(bookingData.startDate) >= new Date(bookingData.endDate))
        return;
    } else {
      if (bookingData.startHour >= bookingData.endHour) return;
    }

    try {
      setAvailabilityLoading(true);
      const result = await checkVehicleAvailability(vehicleId, bookingData);
      setAvailabilityStatus(result);

      // Auto-show conflict details if booking is not available
      if (!result.available && result.conflictingBooking) {
        setShowConflictDetails(true);
      }
    } catch (error) {
      console.error("Availability check failed:", error);
      setAvailabilityStatus({
        available: false,
        message: "Unable to check availability. Please try again.",
        reason: "error",
      });
    } finally {
      setAvailabilityLoading(false);
    }
  }, [vehicle, vehicleId, bookingData, checkVehicleAvailability]);

  const fetchVehicleDetails = async () => {
    try {
      const vehicleData = await getVehicleById(vehicleId);
      if (vehicleData) {
        setVehicle(vehicleData);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle:", error);
      toast.error("Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!vehicle) return;

    let amount = 0;
    let duration = 0;

    if (bookingData.bookingType === "daily") {
      if (bookingData.startDate && bookingData.endDate) {
        const start = new Date(bookingData.startDate);
        const end = new Date(bookingData.endDate);
        duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
        amount = duration * vehicle.pricePerDay;
      }
    } else if (bookingData.bookingType === "hourly") {
      if (bookingData.startHour && bookingData.endHour) {
        const [startH, startM] = bookingData.startHour.split(":").map(Number);
        const [endH, endM] = bookingData.endHour.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        duration = Math.ceil((endMinutes - startMinutes) / 60);
        if (duration < 1) duration = 1;
        amount = duration * vehicle.pricePerHour;
      }
    }

    setTotalAmount(amount);
  };

  const validateBooking = () => {
    const errors = {};

    if (bookingData.bookingType === "daily") {
      if (!bookingData.startDate) errors.startDate = "Start date is required";
      if (!bookingData.endDate) errors.endDate = "End date is required";
      if (bookingData.startDate && bookingData.endDate) {
        if (new Date(bookingData.startDate) >= new Date(bookingData.endDate)) {
          errors.endDate = "End date must be after start date";
        }
        if (new Date(bookingData.startDate) < new Date().setHours(0, 0, 0, 0)) {
          errors.startDate = "Start date cannot be in the past";
        }
      }
    } else {
      if (!bookingData.startHour) errors.startHour = "Start time is required";
      if (!bookingData.endHour) errors.endHour = "End time is required";
      if (bookingData.startHour && bookingData.endHour) {
        if (bookingData.startHour >= bookingData.endHour) {
          errors.endHour = "End time must be after start time";
        }
      }
      if (!bookingData.startDate) {
        errors.startDate = "Date is required for hourly booking";
      } else {
        const selectedDate = new Date(bookingData.startDate);
        const today = new Date();
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          errors.startDate = "Date cannot be in the past";
        }

        if (
          selectedDate.getTime() === today.getTime() &&
          bookingData.startHour
        ) {
          const now = new Date();
          const [startH, startM] = bookingData.startHour.split(":").map(Number);
          const startTime = new Date();
          startTime.setHours(startH, startM, 0, 0);

          if (startTime <= now) {
            errors.startHour = "Start time cannot be in the past";
          }
        }
      }
    }

    if (!bookingData.pickupLocation.trim())
      errors.pickupLocation = "Pickup location is required";
    if (!bookingData.dropLocation.trim())
      errors.dropLocation = "Drop location is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear availability status when booking details change
    if (
      ["startDate", "endDate", "startHour", "endHour", "bookingType"].includes(
        field
      )
    ) {
      setAvailabilityStatus(null);
      setShowConflictDetails(false);
    }
  };

  // Enhanced submit with comprehensive availability check
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateBooking()) {
      toast.error("Please fix the errors in the form", {
        icon: "❌",
        style: {
          borderRadius: "10px",
          background: "#EF4444",
          color: "#fff",
        },
      });
      return;
    }

    // Final availability check before booking
    if (!availabilityStatus || !availabilityStatus.available) {
      toast.error("Please verify vehicle availability before booking", {
        icon: "⚠️",
        style: {
          borderRadius: "10px",
          background: "#F59E0B",
          color: "#fff",
        },
      });
      await checkAvailabilityForCurrentBooking();
      return;
    }

    const booking = {
      vehicleId: vehicle._id,
      ...bookingData,
      amountPaid: totalAmount,
    };

    const result = await createBooking(booking);
    if (result.success) {
      // Clear availability cache
      clearAvailabilityCache(vehicleId);
      navigate("/my-bookings");
    }
  };

  const getDuration = () => {
    if (
      bookingData.bookingType === "daily" &&
      bookingData.startDate &&
      bookingData.endDate
    ) {
      const start = new Date(bookingData.startDate);
      const end = new Date(bookingData.endDate);
      const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""}`;
    } else if (
      bookingData.bookingType === "hourly" &&
      bookingData.startHour &&
      bookingData.endHour
    ) {
      const [startH, startM] = bookingData.startHour.split(":").map(Number);
      const [endH, endM] = bookingData.endHour.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      let diffHours = Math.ceil((endMinutes - startMinutes) / 60);
      if (diffHours < 1) diffHours = 1;
      return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    }
    return "0 days";
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleBookingTypeChange = (newType) => {
    if (newType === "hourly" && bookingData.bookingType === "daily") {
      handleInputChange("endDate", "");
      if (!bookingData.startHour) {
        handleInputChange("startHour", "");
      }
      if (!bookingData.endHour) {
        handleInputChange("endHour", "");
      }
    } else if (newType === "daily" && bookingData.bookingType === "hourly") {
      handleInputChange("startHour", "");
      handleInputChange("endHour", "");
      if (bookingData.startDate && !bookingData.endDate) {
        const nextDay = new Date(bookingData.startDate);
        nextDay.setDate(nextDay.getDate() + 1);
        handleInputChange("endDate", nextDay.toISOString().split("T")[0]);
      }
    }
    handleInputChange("bookingType", newType);
  };

  const getPrefilledFields = () => {
    const fields = [];
    if (urlPickupDate) fields.push("date");
    if (urlReturnDate) fields.push("returnDate");
    if (urlPickupTime) fields.push("startTime");
    if (urlReturnTime) fields.push("endTime");
    if (urlLocation) fields.push("location");
    return fields;
  };

  const prefilledFields = getPrefilledFields();

  // Enhanced Availability Status Component with Conflict Details
  const AvailabilityStatus = () => {
    if (availabilityLoading) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <Loader className="h-5 w-5 text-blue-600 animate-spin mr-3" />
          <span className="text-blue-800 font-medium">
            Checking availability...
          </span>
        </motion.div>
      );
    }

    if (!availabilityStatus) return null;

    const { available, message, reason, conflictingBooking } =
      availabilityStatus;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border-2 ${
          available
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                available ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {available ? (
                <CheckCircle className="h-4 w-4 text-white" />
              ) : (
                <XCircle className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  available ? "text-green-800" : "text-red-800"
                }`}
              >
                {available
                  ? "✅ Vehicle Available"
                  : "❌ Vehicle Not Available"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  available ? "text-green-700" : "text-red-700"
                }`}
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Conflict Details Section */}
        {!available && conflictingBooking && (
          <div className="border-t border-red-200 p-4 bg-red-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-red-800 flex items-center">
                <Ban className="h-4 w-4 mr-2" />
                Booking Conflict Details
              </h4>
              <Button
                onClick={() => setShowConflictDetails(!showConflictDetails)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                {showConflictDetails ? "Hide" : "Show"} Details
              </Button>
            </div>

            <AnimatePresence>
              {showConflictDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="font-medium text-red-800">
                        Existing Booking:
                      </span>
                    </div>

                    {bookingData.bookingType === "daily" ? (
                      <div className="space-y-2">
                        <div className="flex items-center text-red-700 text-sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span>
                            {new Date(
                              conflictingBooking.startDate
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              conflictingBooking.endDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-red-600">
                          Booking ID:{" "}
                          {conflictingBooking.id?.slice(-8) || "N/A"}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center text-red-700 text-sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span>
                            {new Date(
                              conflictingBooking.startDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center text-red-700 text-sm">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>
                            {conflictingBooking.startHour} -{" "}
                            {conflictingBooking.endHour}
                          </span>
                        </div>
                        <div className="text-xs text-red-600">
                          Booking ID:{" "}
                          {conflictingBooking.id?.slice(-8) || "N/A"}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center mb-2">
                      <Info className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-800">
                        What you can do:
                      </span>
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Choose different dates or times</li>
                      <li>• Select another vehicle from our fleet</li>
                      <li>• Contact support for personalized assistance</li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate("/vehicles")}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Car className="h-4 w-4 mr-2" />
                      View Other Vehicles
                    </Button>
                    <Button
                      onClick={checkAvailabilityForCurrentBooking}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!available && !conflictingBooking && (
          <div className="border-t border-red-200 p-4">
            <Button
              onClick={checkAvailabilityForCurrentBooking}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  if (!vehicleId) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Car className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            No Vehicle Selected
          </h2>
          <p className="text-gray-600 mb-8">
            Please select a vehicle to continue with booking.
          </p>
          <Button
            onClick={() => navigate("/vehicles")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Browse Vehicles
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-xl text-gray-600 font-medium">
            Loading booking details...
          </p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Car className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Vehicle not found
          </h2>
          <p className="text-gray-600 mb-8">
            The vehicle you're trying to book is not available.
          </p>
          <Button
            onClick={() => navigate("/vehicles")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Back Button */}
        <motion.button
          whileHover={{ x: -5, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/vehicle-details?vehicleId=${vehicleId}`)}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-semibold bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Vehicle Details
        </motion.button>

        {/* Enhanced Pre-filled Data Notification */}
        {prefilledFields.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-xl p-4 border-2 ${
              bookingData.bookingType === "hourly"
                ? "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
                : "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
            }`}
          >
            <div className="flex items-start">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  bookingData.bookingType === "hourly"
                    ? "bg-purple-500"
                    : "bg-green-500"
                }`}
              >
                {bookingData.bookingType === "hourly" ? (
                  <Clock className="h-5 w-5 text-white" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="ml-4 flex-1">
                <h4
                  className={`font-semibold ${
                    bookingData.bookingType === "hourly"
                      ? "text-purple-800"
                      : "text-green-800"
                  }`}
                >
                  {bookingData.bookingType === "hourly"
                    ? "Hourly Search Applied"
                    : "Search Details Applied"}
                </h4>
                <p
                  className={`text-sm mt-1 ${
                    bookingData.bookingType === "hourly"
                      ? "text-purple-700"
                      : "text-green-700"
                  }`}
                >
                  Your booking form has been pre-filled with your{" "}
                  {bookingData.bookingType} search preferences.
                  <br />
                  <span className="font-medium">
                    You can edit any of these details below.
                  </span>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {prefilledFields.map((field) => (
                    <span
                      key={field}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        bookingData.bookingType === "hourly"
                          ? "bg-purple-200 text-purple-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {field === "date" && "📅 Date"}
                      {field === "returnDate" && "📅 Return Date"}
                      {field === "startTime" && "⏰ Start Time"}
                      {field === "endTime" && "⏰ End Time"}
                      {field === "location" && "📍 Location"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Enhanced Main Booking Form */}
          <div className="xl:col-span-2 space-y-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden bg-white/90 backdrop-blur-xl border-0 shadow-2xl ring-1 ring-white/20">
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-4xl font-bold text-white mb-2">
                        Complete Your Booking
                      </h2>
                      <p className="text-blue-100 text-lg">
                        Reserve your premium vehicle in just a few steps
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <Car className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Enhanced Booking Type Selection */}
                    <div>
                      <label className="block text-xl font-bold text-gray-900 mb-6">
                        <Zap className="inline h-6 w-6 mr-2 text-blue-600" />
                        Choose Your Rental Type
                        {(urlPickupTime || urlBookingType === "hourly") && (
                          <span className="ml-3 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                            Pre-selected: Hourly
                          </span>
                        )}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.label
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative flex items-center p-8 rounded-2xl border-3 cursor-pointer transition-all shadow-lg hover:shadow-xl ${
                            bookingData.bookingType === "daily"
                              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-blue-200"
                              : "border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            value="daily"
                            checked={bookingData.bookingType === "daily"}
                            onChange={(e) =>
                              handleBookingTypeChange(e.target.value)
                            }
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Calendar className="h-8 w-8 text-blue-600" />
                                {bookingData.bookingType === "daily" && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                                  >
                                    <Check className="h-4 w-4 text-white" />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              Daily Rental
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Perfect for longer trips and extended adventures
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold text-blue-600">
                                {formatPrice(vehicle.pricePerDay)}/day
                              </p>
                              <span className="hidden lg:px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                                Most Popular
                              </span>
                            </div>
                          </div>
                        </motion.label>

                        <motion.label
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative flex items-center p-8 rounded-2xl border-3 cursor-pointer transition-all shadow-lg hover:shadow-xl ${
                            bookingData.bookingType === "hourly"
                              ? "border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-purple-200"
                              : "border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            value="hourly"
                            checked={bookingData.bookingType === "hourly"}
                            onChange={(e) =>
                              handleBookingTypeChange(e.target.value)
                            }
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Clock className="h-8 w-8 text-purple-600" />
                                {bookingData.bookingType === "hourly" && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center"
                                  >
                                    <Check className="h-4 w-4 text-white" />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              Hourly Rental
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Ideal for short trips and quick errands
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold text-purple-600">
                                {formatPrice(vehicle.pricePerHour)}/hour
                              </p>
                              <span className="hidden lg:px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                                Flexible
                              </span>
                            </div>
                          </div>
                        </motion.label>
                      </div>
                    </div>

                    {/* Enhanced Date and Time Selection */}
                    <div>
                      <label className="block text-xl font-bold text-gray-900 mb-6">
                        <Calendar className="inline h-6 w-6 mr-2 text-green-600" />
                        When do you need it?
                      </label>

                      {bookingData.bookingType === "daily" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              <Calendar className="inline h-5 w-5 mr-2 text-blue-600" />
                              Start Date
                              {prefilledFields.includes("date") && (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Pre-filled
                                </span>
                              )}
                            </label>
                            <Input
                              type="date"
                              value={bookingData.startDate}
                              onChange={(e) =>
                                handleInputChange("startDate", e.target.value)
                              }
                              min={
                                new Date(
                                  Date.now() -
                                    new Date().getTimezoneOffset() * 60000
                                )
                                  .toISOString()
                                  .split("T")[0]
                              }
                              // min={new Date().toISOString().split("T")[0]}
                              className={`h-14 text-lg rounded-xl border-2 ${
                                validationErrors.startDate
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-200 focus:border-blue-500"
                              }`}
                              required
                            />
                            {validationErrors.startDate && (
                              <p className="mt-2 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {validationErrors.startDate}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              <Calendar className="inline h-5 w-5 mr-2 text-blue-600" />
                              End Date
                              {prefilledFields.includes("returnDate") && (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Pre-filled
                                </span>
                              )}
                            </label>
                            <Input
                              type="date"
                              value={bookingData.endDate}
                              onChange={(e) =>
                                handleInputChange("endDate", e.target.value)
                              }
                              min={
                                bookingData.startDate ||
                                new Date(
                                  Date.now() -
                                    new Date().getTimezoneOffset() * 60000
                                )
                                  .toISOString()
                                  .split("T")[0]
                              }
                              // min={
                              //   bookingData.startDate ||
                              //   new Date().toISOString().split("T")[0]
                              // }
                              className={`h-14 text-lg rounded-xl border-2 ${
                                validationErrors.endDate
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-200 focus:border-blue-500"
                              }`}
                              required
                            />
                            {validationErrors.endDate && (
                              <p className="mt-2 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {validationErrors.endDate}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Date field for hourly booking */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              <Calendar className="inline h-5 w-5 mr-2 text-purple-600" />
                              Date
                              {prefilledFields.includes("date") && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                  Pre-filled
                                </span>
                              )}
                            </label>
                            <Input
                              type="date"
                              value={bookingData.startDate}
                              onChange={(e) =>
                                handleInputChange("startDate", e.target.value)
                              }
                              min={
                                new Date(
                                  Date.now() -
                                    new Date().getTimezoneOffset() * 60000
                                )
                                  .toISOString()
                                  .split("T")[0]
                              }
                              // min={new Date().toISOString().split("T")[0]}
                              className={`h-14 text-lg rounded-xl border-2 ${
                                validationErrors.startDate
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-200 focus:border-purple-500"
                              }`}
                              required
                            />
                            {validationErrors.startDate && (
                              <p className="mt-2 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {validationErrors.startDate}
                              </p>
                            )}
                          </div>

                          {/* Time fields for hourly booking */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <Clock className="inline h-5 w-5 mr-2 text-purple-600" />
                                Start Time
                                {prefilledFields.includes("startTime") && (
                                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                    Pre-filled
                                  </span>
                                )}
                              </label>
                              <Input
                                type="time"
                                value={bookingData.startHour}
                                onChange={(e) =>
                                  handleInputChange("startHour", e.target.value)
                                }
                                className={`h-14 text-lg rounded-xl border-2 ${
                                  validationErrors.startHour
                                    ? "border-red-300 focus:border-red-500"
                                    : "border-gray-200 focus:border-purple-500"
                                }`}
                                required
                              />
                              {validationErrors.startHour && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  {validationErrors.startHour}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                <Clock className="inline h-5 w-5 mr-2 text-purple-600" />
                                End Time
                                {prefilledFields.includes("endTime") && (
                                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                    Pre-filled
                                  </span>
                                )}
                              </label>
                              <Input
                                type="time"
                                value={bookingData.endHour}
                                onChange={(e) =>
                                  handleInputChange("endHour", e.target.value)
                                }
                                className={`h-14 text-lg rounded-xl border-2 ${
                                  validationErrors.endHour
                                    ? "border-red-300 focus:border-red-500"
                                    : "border-gray-200 focus:border-purple-500"
                                }`}
                                required
                              />
                              {validationErrors.endHour && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  {validationErrors.endHour}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Real-time Availability Status */}
                    {bookingData.startDate &&
                      ((bookingData.bookingType === "daily" &&
                        bookingData.endDate) ||
                        (bookingData.bookingType === "hourly" &&
                          bookingData.startHour &&
                          bookingData.endHour)) && (
                        <div>
                          <label className="block text-xl font-bold text-gray-900 mb-4">
                            <Shield className="inline h-6 w-6 mr-2 text-green-600" />
                            Real-time Availability
                          </label>
                          <AvailabilityStatus />
                        </div>
                      )}

                    {/* Enhanced Location Details */}
                    <div>
                      <label className="block text-xl font-bold text-gray-900 mb-6">
                        <MapPin className="inline h-6 w-6 mr-2 text-green-600" />
                        Pickup & Drop-off Locations
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            <MapPin className="inline h-5 w-5 mr-2 text-green-600" />
                            Pickup Location
                            {prefilledFields.includes("location") && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Pre-filled
                              </span>
                            )}
                          </label>
                          <Input
                            placeholder="Enter pickup address (e.g., Airport, Hotel, etc.)"
                            value={bookingData.pickupLocation}
                            onChange={(e) =>
                              handleInputChange(
                                "pickupLocation",
                                e.target.value
                              )
                            }
                            className={`h-14 text-lg rounded-xl border-2 ${
                              validationErrors.pickupLocation
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-200 focus:border-green-500"
                            }`}
                            required
                          />
                          {validationErrors.pickupLocation && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {validationErrors.pickupLocation}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            <MapPin className="inline h-5 w-5 mr-2 text-red-600" />
                            Drop-off Location
                            {prefilledFields.includes("location") && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Pre-filled
                              </span>
                            )}
                          </label>
                          <Input
                            placeholder="Enter drop-off address"
                            value={bookingData.dropLocation}
                            onChange={(e) =>
                              handleInputChange("dropLocation", e.target.value)
                            }
                            className={`h-14 text-lg rounded-xl border-2 ${
                              validationErrors.dropLocation
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-200 focus:border-red-500"
                            }`}
                            required
                          />
                          {validationErrors.dropLocation && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {validationErrors.dropLocation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Submit Button */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        size="lg"
                        className={`w-full h-16 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl ${
                          availabilityStatus?.available === false
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700"
                        }`}
                        disabled={
                          bookingLoading ||
                          Object.keys(validationErrors).length > 0 ||
                          availabilityStatus?.available === false
                        }
                      >
                        {bookingLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-3" />
                            Processing Your Booking...
                          </>
                        ) : availabilityStatus?.available === false ? (
                          <>
                            <XCircle className="h-6 w-6 mr-3" />
                            Vehicle Not Available
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-6 w-6 mr-3" />
                            Confirm Booking - {formatPrice(totalAmount)}
                          </>
                        )}
                      </Button>
                    </motion.div>

                    {/* Availability Warning */}
                    {availabilityStatus?.available === false && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                      >
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mr-3" />
                          <div>
                            <p className="text-amber-800 font-semibold">
                              Cannot proceed with booking
                            </p>
                            <p className="text-amber-700 text-sm">
                              Please choose different dates/times or select
                              another vehicle.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </form>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Enhanced Booking Summary Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="sticky top-24 overflow-hidden bg-white/90 backdrop-blur-xl border-0 shadow-2xl ring-1 ring-white/20">
                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">
                      Booking Summary
                    </h3>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Enhanced Vehicle Info */}
                  <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-inner">
                    <img
                      src={vehicle.images?.[0] || "/api/placeholder/100/80"}
                      alt={vehicle.title}
                      className="w-24 h-20 object-cover rounded-xl shadow-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">
                        {vehicle.title}
                      </h4>
                      <p className="text-gray-600 font-medium">
                        {vehicle.type} • {vehicle.brand}
                      </p>
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-bold ml-1">
                          {vehicle.reviewCount || "4.8"}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({vehicle.rating?.toFixed(1) || "0.0"} reviews)
                        </span>
                        {/* <span className="text-gray-600 text-xs sm:text-sm">
                          ({reviews.length} reviews)
                        </span> */}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Vehicle Specs */}
                  {vehicle.specs && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-2xl border border-blue-200">
                      <h4 className="font-bold text-gray-900 mb-3">
                        Vehicle Features
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {vehicle.specs.seats && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-blue-600 mr-2" />
                            <span>{vehicle.specs.seats}</span>
                          </div>
                        )}
                        {vehicle.specs.fuel && (
                          <div className="flex items-center">
                            <Fuel className="h-4 w-4 text-green-600 mr-2" />
                            <span>{vehicle.specs.fuel}</span>
                          </div>
                        )}
                        {vehicle.specs.transmission && (
                          <div className="flex items-center col-span-2">
                            <Settings className="h-4 w-4 text-purple-600 mr-2" />
                            <span>{vehicle.specs.transmission}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Availability Indicator */}
                  <div
                    className={`p-4 rounded-2xl border-2 ${
                      availabilityStatus?.available === true
                        ? "bg-green-50 border-green-200"
                        : availabilityStatus?.available === false
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">Status:</span>
                      <div className="flex items-center">
                        {availabilityLoading ? (
                          <>
                            <Loader className="h-4 w-4 text-blue-600 animate-spin mr-2" />
                            <span className="text-blue-600 font-medium">
                              Checking...
                            </span>
                          </>
                        ) : availabilityStatus?.available === true ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-green-600 font-bold">
                              Available
                            </span>
                          </>
                        ) : availabilityStatus?.available === false ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-red-600 font-bold">
                              Not Available
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-gray-600 mr-2" />
                            <span className="text-gray-600 font-medium">
                              Not checked
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Booking Details */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                      <span className="text-sm font-semibold text-gray-600">
                        Rental Type:
                      </span>
                      <span className="text-sm font-bold text-gray-900 capitalize flex items-center">
                        {bookingData.bookingType === "daily" ? (
                          <>
                            <Calendar className="h-4 w-4 mr-1 text-blue-600" />{" "}
                            Daily
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-1 text-purple-600" />{" "}
                            Hourly
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                      <span className="text-sm font-semibold text-gray-600">
                        Rate:
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(
                          bookingData.bookingType === "daily"
                            ? vehicle.pricePerDay
                            : vehicle.pricePerHour
                        )}
                        /{bookingData.bookingType === "daily" ? "day" : "hour"}
                      </span>
                    </div>

                    {/* Enhanced Duration Display */}
                    {((bookingData.startDate && bookingData.endDate) ||
                      (bookingData.startHour && bookingData.endHour)) && (
                      <div
                        className={`flex justify-between items-center py-3 px-4 rounded-xl border-2 ${
                          bookingData.bookingType === "hourly"
                            ? "bg-purple-50 border-purple-200"
                            : "bg-green-50 border-green-200"
                        }`}
                      >
                        <span
                          className={`text-sm font-semibold ${
                            bookingData.bookingType === "hourly"
                              ? "text-purple-700"
                              : "text-green-700"
                          }`}
                        >
                          Duration:
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            bookingData.bookingType === "hourly"
                              ? "text-purple-800"
                              : "text-green-800"
                          }`}
                        >
                          {getDuration()}
                        </span>
                      </div>
                    )}

                    {/* Enhanced Date/Time Display */}
                    {bookingData.bookingType === "daily" &&
                      bookingData.startDate && (
                        <div className="py-3 px-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="text-sm font-semibold text-blue-700 flex items-center mb-2">
                            <Calendar className="h-4 w-4 mr-1" />
                            Rental Period:
                          </div>
                          <div className="text-sm text-blue-800 space-y-1">
                            <div>
                              From:{" "}
                              {new Date(
                                bookingData.startDate
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            {bookingData.endDate && (
                              <div>
                                To:{" "}
                                {new Date(
                                  bookingData.endDate
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {bookingData.bookingType === "hourly" &&
                      bookingData.startDate && (
                        <div className="py-3 px-4 bg-purple-50 rounded-xl border border-purple-200">
                          <div className="text-sm font-semibold text-purple-700 flex items-center mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            Rental Time:
                          </div>
                          <div className="text-sm text-purple-800 space-y-1">
                            <div>
                              Date:{" "}
                              {new Date(
                                bookingData.startDate
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            {bookingData.startHour && (
                              <div>From: {bookingData.startHour}</div>
                            )}
                            {bookingData.endHour && (
                              <div>To: {bookingData.endHour}</div>
                            )}
                          </div>
                        </div>
                      )}

                    {bookingData.pickupLocation && (
                      <div className="py-3 px-4 bg-gray-50 rounded-xl">
                        <span className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                          <MapPin className="h-4 w-4 mr-1 text-green-600" />
                          Pickup:
                        </span>
                        <p className="text-sm text-gray-900 font-medium">
                          {bookingData.pickupLocation}
                        </p>
                      </div>
                    )}

                    {bookingData.dropLocation &&
                      bookingData.dropLocation !==
                        bookingData.pickupLocation && (
                        <div className="py-3 px-4 bg-gray-50 rounded-xl">
                          <span className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                            <MapPin className="h-4 w-4 mr-1 text-red-600" />
                            Drop-off:
                          </span>
                          <p className="text-sm text-gray-900 font-medium">
                            {bookingData.dropLocation}
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Enhanced Total Amount */}
                  <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-blue-100 shadow-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">
                        Total Amount:
                      </span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                    {totalAmount > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Base Price:</span>
                          <span>{formatPrice(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Taxes & Fees:</span>
                          <span>Included</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Security Features */}
                  <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                    <div className="flex items-center text-green-800 mb-4">
                      <Shield className="h-6 w-6 mr-3" />
                      <span className="font-bold text-lg">
                        100% Secure Booking
                      </span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-3">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        24/7 Premium Customer Support
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Free Cancellation Available
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Secure Payment Gateway
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Real-time Availability Check
                      </li>
                    </ul>
                  </div>

                  {/* Support Contact */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                    <div className="flex items-center text-gray-800 mb-3">
                      <HeadphonesIcon className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Need Help?</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={
                          () =>
                            window.open("https://wa.me/919876543210", "_blank") // Replace with vehicle owner's WhatsApp number
                        }
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                      <Button
                        onClick={() =>
                          navigate(isAdmin ? "/admin/chat" : "/user-chat")
                        }
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {isAdmin ? "Manage Chats" : "Chat"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingPage;

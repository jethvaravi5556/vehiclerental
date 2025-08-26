import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Search,
  Users,
  Fuel,
  Phone,
  Share2,
  ChevronRight,
  CalendarDays,
  Timer,
  MapIcon,
  DollarSign,
  Download,
  CreditCard,
} from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, loading, fetchMyBookings, cancelBooking } = useBooking();

  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const filterAndSortBookings = () => {
    let filtered = [...bookings];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.vehicle?.title?.toLowerCase().includes(search) ||
          booking.vehicle?.brand?.toLowerCase().includes(search) ||
          booking.pickupLocation?.toLowerCase().includes(search) ||
          booking.dropLocation?.toLowerCase().includes(search) ||
          booking._id.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (booking) => booking.bookingType === typeFilter
      );
    }

    // Sort bookings
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "startDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === "amountPaid") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async (bookingId, vehicleTitle) => {
    if (
      window.confirm(
        `Are you sure you want to cancel the booking for "${vehicleTitle}"?`
      )
    ) {
      const result = await cancelBooking(bookingId);
      if (result.success) {
        // Refresh bookings to get updated data
        await fetchMyBookings();
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "cancelled":
        return <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "completed":
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const canCancelBooking = (booking) => {
    if (booking.status !== "confirmed") return false;

    // Check if booking is in the future
    const now = new Date();
    const bookingStart = new Date(booking.startDate);

    if (booking.bookingType === "hourly") {
      const [hours, minutes] = booking.startHour.split(":").map(Number);
      bookingStart.setHours(hours, minutes, 0, 0);
    }

    return bookingStart > now;
  };

  const getDuration = (booking) => {
    if (booking.bookingType === "daily") {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""}`;
    } else {
      const [startH, startM] = booking.startHour.split(":").map(Number);
      const [endH, endM] = booking.endHour.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const diffHours = Math.ceil((endMinutes - startMinutes) / 60);
      return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    }
  };

  const getBookingStats = () => {
    const stats = {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      totalSpent: bookings
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + (b.amountPaid || 0), 0),
    };
    return stats;
  };

  const stats = getBookingStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 sm:pt-20 px-4 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-lg sm:text-xl text-gray-600 font-medium">
            Loading your bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-16 sm:pt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 sm:mb-8"
        >
          <div className="text-center sm:text-left mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              My Bookings
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Manage and track all your vehicle reservations
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-blue-100 text-xs sm:text-sm font-medium">
                        Total Bookings
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                        {stats.total}
                      </p>
                    </div>
                    <Car className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-200 self-end sm:self-auto" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-green-100 text-xs sm:text-sm font-medium">
                        Confirmed
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                        {stats.confirmed}
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-200 self-end sm:self-auto" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-purple-100 text-xs sm:text-sm font-medium">
                        Completed
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                        {stats.completed}
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-200 self-end sm:self-auto" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-red-100 text-xs sm:text-sm font-medium">
                        Cancelled
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                        {stats.cancelled}
                      </p>
                    </div>
                    <XCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-200 self-end sm:self-auto" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="col-span-2 sm:col-span-3 lg:col-span-1"
            >
              <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-yellow-100 text-xs sm:text-sm font-medium">
                        Total Spent
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {formatPrice(stats.totalSpent)}
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-200 self-end sm:self-auto" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <Card className="bg-white shadow-lg border">
            <div className="p-4 sm:p-6">
              <div className="space-y-4 lg:space-y-0 lg:flex lg:gap-6">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm sm:text-base placeholder-gray-400"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium text-sm sm:text-base min-w-[120px] sm:min-w-[140px]"
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium text-sm sm:text-base min-w-[120px] sm:min-w-[140px]"
                  >
                    <option value="all">All Types</option>
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                  </select>

                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-");
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium text-sm sm:text-base min-w-[140px] sm:min-w-[160px]"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="startDate-desc">Latest Date</option>
                    <option value="startDate-asc">Earliest Date</option>
                    <option value="amountPaid-desc">Highest Amount</option>
                    <option value="amountPaid-asc">Lowest Amount</option>
                  </select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  Showing{" "}
                  <span className="text-blue-600 font-bold">
                    {filteredBookings.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-purple-600 font-bold">
                    {bookings.length}
                  </span>{" "}
                  bookings
                </p>
                {(searchTerm ||
                  statusFilter !== "all" ||
                  typeFilter !== "all") && (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setTypeFilter("all");
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 text-sm"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 sm:space-y-6"
          >
            <AnimatePresence>
              {filteredBookings.map((booking, index) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  index={index}
                  onCancel={handleCancelBooking}
                  canCancel={canCancelBooking(booking)}
                  formatPrice={formatPrice}
                  formatDate={formatDate}
                  getDuration={getDuration}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  navigate={navigate}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 sm:py-20"
          >
            <div className="mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                {bookings.length === 0
                  ? "No bookings yet"
                  : "No bookings match your filters"}
              </h3>
              <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
                {bookings.length === 0
                  ? "Start exploring our vehicle collection and make your first booking!"
                  : "Try adjusting your search criteria or filters to find the bookings you're looking for."}
              </p>
              {bookings.length === 0 ? (
                <Button
                  onClick={() => navigate("/vehicles")}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
                >
                  <Car className="h-4 w-4 mr-2" />
                  Browse Vehicles
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Responsive Booking Card Component
const BookingCard = ({
  booking,
  index,
  onCancel,
  canCancel,
  formatPrice,
  formatDate,
  getDuration,
  getStatusColor,
  getStatusIcon,
  navigate,
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: { opacity: 0, y: -20 },
  };

  const handleViewDetails = () => {
    navigate(`/vehicle-details?vehicleId=${booking.vehicle._id}`);
  };

  const getBookingTypeDisplay = () => {
    return booking.bookingType === "hourly" ? (
      <div className="flex items-center gap-1 text-purple-600">
        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="font-medium text-xs sm:text-sm">Hourly</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-blue-600">
        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="font-medium text-xs sm:text-sm">Daily</span>
      </div>
    );
  };

  const getDateTimeDisplay = () => {
    if (booking.bookingType === "daily") {
      return (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-gray-600">
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs sm:text-sm break-words">
              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-gray-600">
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs sm:text-sm">
              {formatDate(booking.startDate)}
            </span>
          </div>
          <div className="flex items-start gap-2 text-gray-600">
            <Timer className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs sm:text-sm">
              {booking.startHour} - {booking.endHour}
            </span>
          </div>
        </div>
      );
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -2, scale: 1.005 }}
      className="group"
    >
      <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border">
        <div className="p-4 sm:p-6">
          {/* Mobile Layout */}
          <div className="block lg:hidden space-y-4">
            {/* Vehicle Info Header */}
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={booking.vehicle?.images?.[0] || "/api/placeholder/80/60"}
                  alt={booking.vehicle?.title}
                  className="w-16 h-12 sm:w-20 sm:h-16 object-cover rounded-lg shadow-md"
                />
                <div className="absolute -top-1 -right-1">
                  <span
                    className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold border ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusIcon(booking.status)}
                    <span className="ml-1 capitalize hidden sm:inline">
                      {booking.status}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors break-words">
                  {booking.vehicle?.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-2">
                  {booking.vehicle?.brand} • {booking.vehicle?.type}
                </p>
                <div className="flex items-center flex-wrap gap-2">
                  {getBookingTypeDisplay()}
                  <div className="flex items-center gap-1 text-gray-500">
                    <span className="text-xs">ID:</span>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {booking._id.slice(-8)}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Content Grid */}
            <div className="space-y-4">
              {/* Schedule */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Schedule
                </h4>
                {getDateTimeDisplay()}
                <div className="mt-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Duration: {getDuration(booking)}
                  </span>
                </div>
              </div>

              {/* Locations */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Locations
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Pickup</p>
                      <p className="text-sm text-gray-800 font-medium break-words">
                        {booking.pickupLocation}
                      </p>
                    </div>
                  </div>
                  {booking.dropLocation !== booking.pickupLocation && (
                    <div className="flex items-start gap-2">
                      <MapIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Drop-off</p>
                        <p className="text-sm text-gray-800 font-medium break-words">
                          {booking.dropLocation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount & Details */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Payment & Details
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-xs sm:text-sm font-medium text-green-700">
                        Amount Paid
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-green-800">
                      {formatPrice(booking.amountPaid)}
                    </span>
                  </div>

                  {booking.vehicle?.specs && (
                    <div className="flex items-center gap-4 text-xs sm:text-sm">
                      {booking.vehicle.specs.seats && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{booking.vehicle.specs.seats} seats</span>
                        </div>
                      )}
                      {booking.vehicle.specs.fuel && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Fuel className="h-3 w-3" />
                          <span>{booking.vehicle.specs.fuel}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleViewDetails}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>

                {canCancel && (
                  <Button
                    onClick={() =>
                      onCancel(booking._id, booking.vehicle?.title)
                    }
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>

              {/* Mobile Secondary Actions */}
              <div className="flex gap-2 ">
                {/* WhatsApp Support */}
                <Button

                  variant="outline"
                  size="sm"
                  className="flex-1 text-gray-600 hover:text-gray-800 text-xs sm:text-sm"
                  title="Contact Support"
                  onClick={() => {
                    const phoneNumber = "919428805556"; // replace with your support number
                    const message = "Hello, I need help with my booking."; // optional
                    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
                      message
                    )}`;
                    window.open(url, "_blank"); // open WhatsApp in new tab
                  }}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>

                {booking.status === "completed" && (
                  <>
                    {/* Rate Experience */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-gray-600 hover:text-gray-800 text-xs sm:text-sm"
                      title="Rate Experience"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Rate
                    </Button>

                    {/* Download Receipt */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-gray-600 hover:text-gray-800 text-xs sm:text-sm"
                      title="Download Receipt"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Receipt
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-6">
              {/* Vehicle Image and Basic Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={
                      booking.vehicle?.images?.[0] || "/api/placeholder/120/80"
                    }
                    alt={booking.vehicle?.title}
                    className="w-24 h-20 object-cover rounded-xl shadow-md"
                  />
                  <div className="absolute -top-2 -right-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusIcon(booking.status)}
                      <span className="ml-1 capitalize">{booking.status}</span>
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {booking.vehicle?.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {booking.vehicle?.brand} • {booking.vehicle?.type}
                  </p>
                  <div className="flex items-center gap-4">
                    {getBookingTypeDisplay()}
                    <div className="flex items-center gap-1 text-gray-500">
                      <span className="text-xs">ID:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {booking._id.slice(-8)}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="flex-1 grid grid-cols-3 gap-6">
                {/* Date & Time */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Schedule
                  </h4>
                  {getDateTimeDisplay()}
                  <div className="mt-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                      Duration: {getDuration(booking)}
                    </span>
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Locations
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup</p>
                        <p className="text-sm text-gray-800 font-medium line-clamp-2">
                          {booking.pickupLocation}
                        </p>
                      </div>
                    </div>
                    {booking.dropLocation !== booking.pickupLocation && (
                      <div className="flex items-start gap-2">
                        <MapIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Drop-off</p>
                          <p className="text-sm text-gray-800 font-medium line-clamp-2">
                            {booking.dropLocation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount & Vehicle Details */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Amount Paid
                        </span>
                      </div>
                      <span className="text-lg font-bold text-green-800">
                        {formatPrice(booking.amountPaid)}
                      </span>
                    </div>

                    {booking.vehicle?.specs && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {booking.vehicle.specs.seats && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="h-3 w-3" />
                            <span>{booking.vehicle.specs.seats}</span>
                          </div>
                        )}
                        {booking.vehicle.specs.fuel && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Fuel className="h-3 w-3" />
                            <span>{booking.vehicle.specs.fuel}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 w-32">
                <Button
                  onClick={handleViewDetails}
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>

                {canCancel && (
                  <Button
                    onClick={() =>
                      onCancel(booking._id, booking.vehicle?.title)
                    }
                    variant="outline"
                    size="sm"
                    className="w-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}

                <div className="flex gap-2">
                  {/* WhatsApp Support */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-gray-600 hover:text-gray-800"
                    title="Contact Support"
                    onClick={() => {
                      const phoneNumber = "919428805556"; // replace with your support number
                      const message = "Hello, I need help with my booking."; // optional
                      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
                        message
                      )}`;
                      window.open(url, "_blank"); // open WhatsApp in new tab
                    }}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Timeline (for confirmed bookings) */}
          {booking.status === "confirmed" && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  <span>Booking Confirmed</span>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <span className="text-gray-500">
                    {formatDate(booking.createdAt)}
                  </span>
                </div>

                {new Date(booking.startDate) > new Date() && (
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="font-medium">Upcoming</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Info */}
          {booking.status === "cancelled" && booking.cancelledAt && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Cancelled on {formatDate(booking.cancelledAt)}</span>
              </div>
            </div>
          )}

          {/* Completion Info */}
          {booking.status === "completed" && booking.completedAt && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Completed on {formatDate(booking.completedAt)}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                  >
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Rate Experience
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-700 text-xs sm:text-sm"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Receipt
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default MyBookingsPage;

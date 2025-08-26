// pages/admin/AdminBookings.jsx
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Car,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  FileText,
  Activity,
  TrendingUp,
  AlertCircle,
  Printer,
  Mail,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import axios from "../../axiosConfig";
import toast from "react-hot-toast";
import {
  generateInvoice,
  previewInvoice,
  generateInvoiceBlob,
} from "../../utils/invoiceGenerator";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(null);
  const [emailingInvoice, setEmailingInvoice] = useState(null);

  // Fetch bookings
  const fetchBookings = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await axios.get("/api/admin/bookings");
      setBookings(response.data);
      if (showRefreshing) {
        toast.success("Bookings data refreshed successfully!");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle invoice generation
  const handleGenerateInvoice = async (booking) => {
    setGeneratingInvoice(booking._id);

    try {
      const result = generateInvoice(booking, true);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setGeneratingInvoice(null);
    }
  };

  // Handle invoice preview
  const handlePreviewInvoice = async (booking) => {
    setGeneratingInvoice(booking._id);

    try {
      const result = previewInvoice(booking);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error previewing invoice:", error);
      toast.error("Failed to preview invoice");
    } finally {
      setGeneratingInvoice(null);
    }
  };

  // Handle email invoice (placeholder - you'll need to implement backend endpoint)
  const handleEmailInvoice = async (booking) => {
    const { file, fileName } = await generateInvoiceBlob(booking);

    const formData = new FormData();
    formData.append("invoice", file); // ✅ Valid File object
    formData.append("bookingId", booking._id);
    formData.append("customerEmail", booking.user?.email);
    formData.append("customerName", booking.user?.name);

    try {
      const response = await axios.post(
        "/api/admin/send-invoice-email",
        formData
      ); // ✅ don't set headers
      console.log("✅ Email sent:", response.data);
      toast.success("Invoice emailed successfully");
    } catch (error) {
      console.error("❌ Error emailing invoice:", error);
      toast.error("Failed to send invoice");
    }
  };

  // Calculate booking statistics
  const bookingStats = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return {
        total: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
        avgBookingValue: 0,
        dailyBookings: 0,
        hourlyBookings: 0,
      };
    }

    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (b.amountPaid || 0),
      0
    );
    const avgBookingValue = total > 0 ? totalRevenue / total : 0;
    const dailyBookings = bookings.filter(
      (b) => b.bookingType === "daily"
    ).length;
    const hourlyBookings = bookings.filter(
      (b) => b.bookingType === "hourly"
    ).length;

    return {
      total,
      confirmed,
      completed,
      cancelled,
      totalRevenue,
      avgBookingValue,
      dailyBookings,
      hourlyBookings,
    };
  }, [bookings]);

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    if (!bookings) return [];

    let filtered = [...bookings];

    // Apply search filter
    if (search) {
      filtered = filtered.filter((booking) => {
        const searchTerm = search.toLowerCase();
        return (
          booking.user?.name?.toLowerCase().includes(searchTerm) ||
          booking.user?.email?.toLowerCase().includes(searchTerm) ||
          booking.vehicle?.title?.toLowerCase().includes(searchTerm) ||
          booking.vehicle?.brand?.toLowerCase().includes(searchTerm) ||
          booking._id.toLowerCase().includes(searchTerm)
        );
      });
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

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        switch (dateFilter) {
          case "today":
            return bookingDate >= today;
          case "yesterday":
            return bookingDate >= yesterday && bookingDate < today;
          case "week":
            return bookingDate >= lastWeek;
          case "month":
            return bookingDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "amountPaid") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortBy === "createdAt" || sortBy === "startDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === "user.name") {
        aValue = a.user?.name || "";
        bValue = b.user?.name || "";
      } else if (sortBy === "vehicle.title") {
        aValue = a.vehicle?.title || "";
        bValue = b.vehicle?.title || "";
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    bookings,
    search,
    statusFilter,
    typeFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  // Export bookings to CSV
  const exportBookings = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Booking ID,Customer,Vehicle,Type,Status,Amount,Date,Duration\n" +
      filteredAndSortedBookings
        .map((booking) => {
          const duration =
            booking.bookingType === "daily"
              ? `${booking.startDate} - ${booking.endDate}`
              : `${booking.startHour} - ${booking.endHour}`;
          return `"${booking._id}","${booking.user?.name || "N/A"}","${
            booking.vehicle?.title || "N/A"
          }","${booking.bookingType}","${booking.status}","₹${
            booking.amountPaid || 0
          }","${new Date(
            booking.createdAt
          ).toLocaleDateString()}","${duration}"`;
        })
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bookings_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Bookings exported successfully!");
  };

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "confirmed":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-200",
          icon: Clock,
        };
      case "completed":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-200",
          icon: CheckCircle,
        };
      case "cancelled":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-200",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200",
          icon: AlertCircle,
        };
    }
  };

  // Format booking duration
  const formatBookingDuration = (booking) => {
    if (booking.bookingType === "daily") {
      const start = new Date(booking.startDate).toLocaleDateString();
      const end = new Date(booking.endDate).toLocaleDateString();
      return start === end ? start : `${start} - ${end}`;
    } else {
      return `${booking.startHour} - ${booking.endHour}`;
    }
  };

  if (loading) {
    return (
      <AdminLayout
        title="Booking Management"
        subtitle="Monitor and manage all vehicle bookings"
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <LoadingSpinner size="xl" className="py-20" />
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Booking Management"
      subtitle="Monitor and manage all vehicle bookings"
      // onRefresh={() => fetchBookings(true)}
      // refreshing={refreshing}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header with Stats */}
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 shadow-xl text-white overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">
                  Booking Analytics
                </h2>
                <p className="text-indigo-100 text-sm sm:text-base">
                  Monitor and manage all vehicle bookings
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowStatsModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportBookings}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Bookings",
                  value: bookingStats.total,
                  icon: Calendar,
                  change: "+12%",
                },
                {
                  label: "Active Bookings",
                  value: bookingStats.confirmed,
                  icon: Clock,
                  change: "+8%",
                },
                {
                  label: "Completed",
                  value: bookingStats.completed,
                  icon: CheckCircle,
                  change: "+15%",
                },
                {
                  label: "Revenue",
                  value: `₹${bookingStats.totalRevenue.toLocaleString()}`,
                  icon: DollarSign,
                  change: "+23%",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/20 rounded-xl p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 text-green-300 mr-1" />
                        <span className="text-xs text-green-300">
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <stat.icon className="h-8 w-8 text-indigo-200" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* Filters and Search */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="p-4 sm:p-6">
            {/* Top Section */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer, vehicle, or booking ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/70 text-sm sm:text-base"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 text-sm sm:text-base"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 text-sm sm:text-base"
                >
                  <option value="all">All Types</option>
                  <option value="daily">Daily</option>
                  <option value="hourly">Hourly</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 text-sm sm:text-base"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-gray-200 flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base"
                >
                  <Filter className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">More</span>
                  <ChevronDown
                    className={`h-4 w-4 ml-1 sm:ml-2 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="createdAt">Booking Date</option>
                        <option value="startDate">Start Date</option>
                        <option value="amountPaid">Amount</option>
                        <option value="user.name">Customer Name</option>
                        <option value="vehicle.title">Vehicle</option>
                        <option value="status">Status</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order
                      </label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Results
                      </label>
                      <p className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
                        {filteredAndSortedBookings.length} bookings found
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Bookings Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Booking Details
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Customer
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Vehicle
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Duration
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredAndSortedBookings.map((booking, index) => {
                    const statusStyle = getStatusStyle(booking.status);
                    const StatusIcon = statusStyle.icon;

                    return (
                      <motion.tr
                        key={booking._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Booking Details */}
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900">
                              #{booking._id.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {booking.bookingType === "daily"
                                ? "Daily Rental"
                                : "Hourly Rental"}
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-medium mr-3">
                              {booking.user?.name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {booking.user?.name || "Unknown User"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.user?.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            {booking.vehicle?.images &&
                            booking.vehicle.images[0] ? (
                              <img
                                src={booking.vehicle.images[0]}
                                alt={booking.vehicle.title}
                                className="h-10 w-10 rounded-lg object-cover mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                                <Car className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {booking.vehicle?.title || "Unknown Vehicle"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.vehicle?.brand} •{" "}
                                {booking.vehicle?.type}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {formatBookingDuration(booking)}
                            </div>
                            {booking.pickupLocation && (
                              <div className="text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {booking.pickupLocation}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-green-600 text-lg">
                            ₹{booking.amountPaid?.toLocaleString() || 0}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowBookingModal(true);
                              }}
                              className="hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Invoice Actions Dropdown */}
                            <div className="relative group">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-green-50 hover:text-green-600"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>

                              {/* Dropdown Menu */}
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="py-2">
                                  <button
                                    onClick={() =>
                                      handleGenerateInvoice(booking)
                                    }
                                    disabled={generatingInvoice === booking._id}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                  >
                                    {generatingInvoice === booking._id ? (
                                      <LoadingSpinner
                                        size="sm"
                                        className="mr-2"
                                      />
                                    ) : (
                                      <Download className="h-4 w-4 mr-2" />
                                    )}
                                    Download Invoice
                                  </button>

                                  <button
                                    onClick={() =>
                                      handlePreviewInvoice(booking)
                                    }
                                    disabled={generatingInvoice === booking._id}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                  >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Preview Invoice
                                  </button>

                                  {booking.user?.email && (
                                    <button
                                      onClick={() =>
                                        handleEmailInvoice(booking)
                                      }
                                      disabled={emailingInvoice === booking._id}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                    >
                                      {emailingInvoice === booking._id ? (
                                        <LoadingSpinner
                                          size="sm"
                                          className="mr-2"
                                        />
                                      ) : (
                                        <Mail className="h-4 w-4 mr-2" />
                                      )}
                                      Email Invoice
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredAndSortedBookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bookings found
                </h3>
                <p className="text-gray-500">
                  No bookings match your current search criteria.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Booking Details Modal */}
        <Modal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          title="Booking Details"
          size="lg"
        >
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Booking #{selectedBooking._id.slice(-8)}
                  </h3>
                  <p className="text-gray-600">
                    Created on{" "}
                    {new Date(selectedBooking.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{selectedBooking.amountPaid?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
              </div>

              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Customer Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Name:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedBooking.user?.name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Email:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedBooking.user?.email || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    Vehicle Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Vehicle:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedBooking.vehicle?.title || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Brand:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedBooking.vehicle?.brand || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Type:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedBooking.vehicle?.type || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Booking Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Type:
                    </span>
                    <span className="ml-2 text-gray-900 capitalize">
                      {selectedBooking.bookingType} Rental
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Status:
                    </span>
                    <span className="ml-2">
                      {(() => {
                        const statusStyle = getStatusStyle(
                          selectedBooking.status
                        );
                        const StatusIcon = statusStyle.icon;
                        return (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {selectedBooking.status.charAt(0).toUpperCase() +
                              selectedBooking.status.slice(1)}
                          </span>
                        );
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Duration:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {formatBookingDuration(selectedBooking)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Amount:
                    </span>
                    <span className="ml-2 text-green-600 font-semibold">
                      ₹{selectedBooking.amountPaid?.toLocaleString() || 0}
                    </span>
                  </div>
                  {selectedBooking.pickupLocation && (
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-gray-700">
                        Pickup Location:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedBooking.pickupLocation}
                      </span>
                    </div>
                  )}
                  {selectedBooking.dropLocation && (
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-gray-700">
                        Drop Location:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedBooking.dropLocation}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between space-x-3">
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateInvoice(selectedBooking)}
                    disabled={generatingInvoice === selectedBooking._id}
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    {generatingInvoice === selectedBooking._id ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download Invoice
                  </Button>

                  {selectedBooking.user?.email && (
                    <Button
                      variant="outline"
                      onClick={() => handleEmailInvoice(selectedBooking)}
                      disabled={emailingInvoice === selectedBooking._id}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      {emailingInvoice === selectedBooking._id ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Email Invoice
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowBookingModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Analytics Modal */}
        <Modal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          title="Booking Analytics"
          size="lg"
        >
          <div className="space-y-6">
            {/* Revenue Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-medium">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      ₹{bookingStats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-medium">
                      Avg Booking Value
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      ₹
                      {Math.round(
                        bookingStats.avgBookingValue
                      ).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 text-sm font-medium">
                      Completion Rate
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {bookingStats.total > 0
                        ? Math.round(
                            (bookingStats.completed / bookingStats.total) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Booking Type Distribution */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-4">
                Booking Type Distribution
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {bookingStats.dailyBookings}
                  </div>
                  <div className="text-sm text-gray-600">Daily Bookings</div>
                  <div className="text-xs text-gray-500">
                    {bookingStats.total > 0
                      ? Math.round(
                          (bookingStats.dailyBookings / bookingStats.total) *
                            100
                        )
                      : 0}
                    % of total
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {bookingStats.hourlyBookings}
                  </div>
                  <div className="text-sm text-gray-600">Hourly Bookings</div>
                  <div className="text-xs text-gray-500">
                    {bookingStats.total > 0
                      ? Math.round(
                          (bookingStats.hourlyBookings / bookingStats.total) *
                            100
                        )
                      : 0}
                    % of total
                  </div>
                </div>
              </div>
            </div>

            {/* Status Overview */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-4">
                Status Overview
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {bookingStats.confirmed}
                  </div>
                  <div className="text-sm text-gray-600">Confirmed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {bookingStats.completed}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {bookingStats.cancelled}
                  </div>
                  <div className="text-sm text-gray-600">Cancelled</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowStatsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminBookings;

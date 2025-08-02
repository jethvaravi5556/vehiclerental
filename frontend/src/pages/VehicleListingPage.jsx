import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Grid,
  List,
  MapPin,
  Star,
  Calendar,
  Clock,
  Users,
  Fuel,
  Settings,
  ChevronDown,
  X,
  RefreshCw,
  SlidersHorizontal,
  Heart,
  Zap,
  Award,
  TrendingUp,
  Eye,
  Shield,
} from "lucide-react";
import { useVehicle } from "../contexts/VehicleContext";
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

const VehicleListingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const {
    vehicles,
    loading,
    fetchVehicles,
    getFilterOptions,
    getPriceRange,
    formatPrice,
    getVehicleAvailability,
    toggleSaveVehicle,
    isVehicleSaved,
  } = useVehicle();

  // State management - Fixed the search term initialization
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");

  // Filter states with URL params initialization
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "",
    brand: searchParams.get("brand") || "",
    location: searchParams.get("location") || "",
    priceMin: parseInt(searchParams.get("priceMin")) || "",
    priceMax: parseInt(searchParams.get("priceMax")) || "",
    available: searchParams.get("available") === "true" || false,
    rating: parseFloat(searchParams.get("rating")) || "",
  });

  // Enhanced search-specific state for both daily and hourly
  const [searchDates, setSearchDates] = useState({
    searchType: searchParams.get("searchType") || "daily",
    pickupDate: searchParams.get("pickupDate") || "",
    returnDate: searchParams.get("returnDate") || "",
    pickupTime: searchParams.get("pickupTime") || "",
    returnTime: searchParams.get("returnTime") || "",
  });

  // Fixed: Check if it's search mode without affecting the search term
  const [isSearchMode, setIsSearchMode] = useState(
    searchParams.get("search") === "true"
  );

  // Initialize data on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Handle initial search from URL params
  useEffect(() => {
    if (isSearchMode) {
      // Auto-expand filters if search mode
      setShowFilters(true);

      // Show search info based on search type
      if (
        searchDates.searchType === "hourly" &&
        searchDates.pickupTime &&
        searchDates.returnTime
      ) {
        const duration = calculateHourlyDuration(
          searchDates.pickupTime,
          searchDates.returnTime
        );
        toast.success(
          `Hourly search applied! Showing vehicles for ${duration} hours.`,
          {
            icon: "⏰",
            style: {
              borderRadius: "10px",
              background: "#8B5CF6",
              color: "#fff",
            },
          }
        );
      } else if (
        searchDates.searchType === "daily" &&
        (searchDates.pickupDate || searchDates.returnDate)
      ) {
        toast.success(
          "Daily search applied! Showing vehicles for your dates.",
          {
            icon: "📅",
            style: {
              borderRadius: "10px",
              background: "#10B981",
              color: "#fff",
            },
          }
        );
      } else if (filters.location) {
        toast.success(`Showing vehicles in ${filters.location}`, {
          icon: "📍",
          style: {
            borderRadius: "10px",
            background: "#10B981",
            color: "#fff",
          },
        });
      }
    }
  }, [isSearchMode, searchDates, filters.location]);

  const calculateHourlyDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return Math.ceil((endMinutes - startMinutes) / 60) || 1;
  };

  const calculateDailyDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    return (
      Math.ceil(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
      ) || 1
    );
  };

  const handleSaveVehicle = async (vehicleId, vehicleTitle, e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to save vehicles", {
        icon: "🔒",
        style: {
          borderRadius: "10px",
          background: "#F59E0B",
          color: "#fff",
        },
      });
      navigate("/login");
      return;
    }

    await toggleSaveVehicle(vehicleId, vehicleTitle, "listing");
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) params.set("searchTerm", searchTerm);
    if (filters.type) params.set("type", filters.type);
    if (filters.brand) params.set("brand", filters.brand);
    if (filters.location) params.set("location", filters.location);
    if (filters.priceMin) params.set("priceMin", filters.priceMin);
    if (filters.priceMax) params.set("priceMax", filters.priceMax);
    if (filters.available) params.set("available", "true");
    if (filters.rating) params.set("rating", filters.rating);

    // Handle search dates based on type
    if (searchDates.searchType)
      params.set("searchType", searchDates.searchType);
    if (searchDates.pickupDate)
      params.set("pickupDate", searchDates.pickupDate);

    if (searchDates.searchType === "daily") {
      if (searchDates.returnDate)
        params.set("returnDate", searchDates.returnDate);
    } else {
      if (searchDates.pickupTime)
        params.set("pickupTime", searchDates.pickupTime);
      if (searchDates.returnTime)
        params.set("returnTime", searchDates.returnTime);
    }

    if (isSearchMode) params.set("search", "true");

    setSearchParams(params, { replace: true });
  }, [searchTerm, filters, searchDates, isSearchMode, setSearchParams]);

  // Get filter options from vehicles
  const filterOptions = useMemo(() => {
    return getFilterOptions();
  }, [vehicles, getFilterOptions]);

  // Get price range
  const priceRange = useMemo(() => {
    return getPriceRange();
  }, [vehicles, getPriceRange]);

  // Filter and sort vehicles with search priority
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = [...vehicles];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.title?.toLowerCase().includes(search) ||
          vehicle.brand?.toLowerCase().includes(search) ||
          vehicle.type?.toLowerCase().includes(search) ||
          vehicle.location?.toLowerCase().includes(search)
      );
    }

    // Apply category filters
    if (filters.type) {
      filtered = filtered.filter(
        (vehicle) => vehicle.type?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.brand) {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.brand?.toLowerCase() === filters.brand.toLowerCase()
      );
    }

    if (filters.location) {
      const searchLocation = filters.location.toLowerCase().trim();
      filtered = filtered.filter((vehicle) => {
        const vehicleLocation = vehicle.location?.toLowerCase() || "";
        // Check for exact match or partial match
        return (
          vehicleLocation.includes(searchLocation) ||
          searchLocation.includes(vehicleLocation) ||
          // Check for city names within locations
          vehicleLocation
            .split(",")
            .some(
              (part) =>
                part.trim().includes(searchLocation) ||
                searchLocation.includes(part.trim())
            )
        );
      });
    }

    // Apply price filter based on search type
    if (filters.priceMin || filters.priceMax) {
      filtered = filtered.filter((vehicle) => {
        const price =
          searchDates.searchType === "hourly"
            ? vehicle.pricePerHour || 0
            : vehicle.pricePerDay || 0;

        if (filters.priceMin && price < filters.priceMin) return false;
        if (filters.priceMax && price > filters.priceMax) return false;
        return true;
      });
    }

    // Apply availability filter
    if (filters.available) {
      filtered = filtered.filter((vehicle) => {
        // Check if vehicle is generally available
        if (vehicle.available === false) return false;

        // If specific dates are provided, you could add more complex availability checking here
        // For now, we'll just check the basic availability flag
        return vehicle.available !== false;
      });
    } else {
      // If not filtering for available only, still show all vehicles but prioritize available ones
      filtered = filtered.filter((vehicle) => {
        // You can add more complex logic here if needed
        return true; // Show all vehicles for now
      });
    }

    // Apply rating filter
    if (filters.rating) {
      filtered = filtered.filter(
        (vehicle) => (vehicle.rating || 0) >= filters.rating
      );
    }

    // Search mode: prioritize vehicles that match search location
    if (isSearchMode) {
      filtered.sort((a, b) => {
        let aScore = 0;
        let bScore = 0;

        // Location matching score
        if (filters.location) {
          const searchLocation = filters.location.toLowerCase();
          const aLocation = a.location?.toLowerCase() || "";
          const bLocation = b.location?.toLowerCase() || "";

          if (aLocation.includes(searchLocation)) aScore += 10;
          if (bLocation.includes(searchLocation)) bScore += 10;

          // Exact match gets higher score
          if (aLocation === searchLocation) aScore += 20;
          if (bLocation === searchLocation) bScore += 20;
        }

        // Availability score
        if (a.available === true) aScore += 5;
        if (b.available === true) bScore += 5;

        // Rating score
        aScore += a.rating || 0;
        bScore += b.rating || 0;

        return bScore - aScore; // Higher score first
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // Skip sorting if we're in search mode and already sorted by relevance
      if (isSearchMode && sortBy === "title" && sortOrder === "asc") {
        return 0; // Keep search relevance order
      }

      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";

      if (
        sortBy === "pricePerDay" ||
        sortBy === "pricePerHour" ||
        sortBy === "rating"
      ) {
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

    return filtered;
  }, [
    vehicles,
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    isSearchMode,
    searchDates.searchType,
  ]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle search date changes
  const handleSearchDateChange = (key, value) => {
    setSearchDates((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: "",
      brand: "",
      location: "",
      priceMin: "",
      priceMax: "",
      available: false,
      rating: "",
    });
    setSearchDates({
      searchType: "daily",
      pickupDate: "",
      returnDate: "",
      pickupTime: "",
      returnTime: "",
    });
    setSearchTerm("");
    setIsSearchMode(false);
  };

  // Handle vehicle card click
  const handleVehicleClick = (vehicleId) => {
    navigate(`/vehicle-details?vehicleId=${vehicleId}`);
  };

  // Handle booking click with pre-filled dates
  const handleBookingClick = (vehicleId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to book vehicles", {
        icon: "🔒",
        style: {
          borderRadius: "10px",
          background: "#F59E0B",
          color: "#fff",
        },
      });
      navigate("/login");
      return;
    }

    // Build booking URL with pre-filled dates
    const params = new URLSearchParams();
    params.set("vehicleId", vehicleId);

    if (searchDates.pickupDate) {
      params.set("pickupDate", searchDates.pickupDate);
    }

    if (searchDates.searchType === "daily") {
      if (searchDates.returnDate) {
        params.set("returnDate", searchDates.returnDate);
      }
    } else {
      // For hourly bookings
      if (searchDates.pickupTime) {
        params.set("pickupTime", searchDates.pickupTime);
      }
      if (searchDates.returnTime) {
        params.set("returnTime", searchDates.returnTime);
      }
      params.set("bookingType", "hourly");
    }

    if (filters.location) {
      params.set("location", filters.location);
    }

    navigate(`/booking?${params.toString()}`);

    toast.success("Redirecting to booking...", {
      icon: "🚗",
      style: {
        borderRadius: "10px",
        background: "#10B981",
        color: "#fff",
      },
    });
  };

  // Refresh vehicles
  const handleRefresh = async () => {
    await fetchVehicles();
    toast.success("Vehicles refreshed successfully!", {
      icon: "✨",
      style: {
        borderRadius: "10px",
        background: "#8B5CF6",
        color: "#fff",
      },
    });
  };

  // Get search duration display
  const getSearchDuration = () => {
    if (
      searchDates.searchType === "daily" &&
      searchDates.pickupDate &&
      searchDates.returnDate
    ) {
      const days = calculateDailyDuration(
        searchDates.pickupDate,
        searchDates.returnDate
      );
      return `${days} day${days > 1 ? "s" : ""}`;
    } else if (
      searchDates.searchType === "hourly" &&
      searchDates.pickupTime &&
      searchDates.returnTime
    ) {
      const hours = calculateHourlyDuration(
        searchDates.pickupTime,
        searchDates.returnTime
      );
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return null;
  };
    const getSearchSummary = () => {
    const parts = [];
    if (filters.location) parts.push(`in ${filters.location}`);
    if (filters.type) parts.push(`${filters.type} vehicles`);
    if (searchDates.pickupDate) {
      if (searchDates.searchType === "daily") {
        const duration = getSearchDuration();
        if (duration) parts.push(`for ${duration}`);
      } else {
        const duration = getSearchDuration();
        if (duration) parts.push(`for ${duration}`);
      }
    }
    return parts.length > 0 ? parts.join(' ') : '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Search Info */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {isSearchMode ? "Search Results" : "Vehicle Fleet"}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {isSearchMode
                  ? `Vehicles matching your ${searchDates.searchType} search criteria`
                  : "Find your perfect ride from our extensive collection"}
              </p>

              {/* Enhanced Search Info Bar */}
              {isSearchMode && (searchDates.pickupDate || filters.location) && (
                <div
                  className={`border rounded-lg p-4 mb-4 ${
                    searchDates.searchType === "hourly"
                      ? "bg-purple-50 border-purple-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 mb-2 ${
                      searchDates.searchType === "hourly"
                        ? "text-purple-800"
                        : "text-blue-800"
                    }`}
                  >
                    {searchDates.searchType === "hourly" ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <Calendar className="h-5 w-5" />
                    )}
                    <span className="font-semibold">
                      {searchDates.searchType === "hourly"
                        ? "Hourly Search Details:"
                        : "Daily Search Details:"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {filters.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700 font-medium">
                          {filters.location}
                        </span>
                      </div>
                    )}
                    {searchDates.pickupDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-green-700">
                          Date:{" "}
                          {new Date(
                            searchDates.pickupDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {searchDates.searchType === "daily" &&
                      searchDates.returnDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-red-600" />
                          <span className="text-red-700">
                            To:{" "}
                            {new Date(
                              searchDates.returnDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    {searchDates.searchType === "hourly" &&
                      searchDates.pickupTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-700">
                            From: {searchDates.pickupTime}
                          </span>
                        </div>
                      )}
                    {searchDates.searchType === "hourly" &&
                      searchDates.returnTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-purple-700">
                            To: {searchDates.returnTime}
                          </span>
                        </div>
                      )}
                    {getSearchDuration() && (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                          searchDates.searchType === "hourly"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        <span>Duration: {getSearchDuration()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border shadow-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium">
                    {filteredAndSortedVehicles.length} vehicles{" "}
                    {isSearchMode ? "found" : "available"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border shadow-sm">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Quality guaranteed</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border shadow-sm">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Secure & verified</span>
                </div>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleRefresh}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Fleet
              </Button>
            </motion.div>
          </div>

          {/* Search and Controls */}
          <Card className="bg-white shadow-lg border">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for your perfect vehicle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-base placeholder-gray-400"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === "grid"
                          ? "bg-white shadow-sm text-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === "list"
                          ? "bg-white shadow-sm text-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-");
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium min-w-[180px]"
                  >
                    <option value="title-asc">Name A-Z</option>
                    <option value="title-desc">Name Z-A</option>
                    <option value="pricePerDay-asc">Price Low-High</option>
                    <option value="pricePerDay-desc">Price High-Low</option>
                    <option value="rating-desc">Highest Rated</option>
                    <option value="brand-asc">Brand A-Z</option>
                  </select>

                  {/* Filter Toggle */}
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-gray-700 hover:bg-gray-800 px-4 py-2"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    <ChevronDown
                      className={`h-4 w-4 ml-2 transition-transform ${
                        showFilters ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <p className="text-gray-600 font-medium">
                    Showing{" "}
                    <span className="text-blue-600 font-bold">
                      {filteredAndSortedVehicles.length}
                    </span>{" "}
                    of{" "}
                    <span className="text-purple-600 font-bold">
                      {vehicles.length}
                    </span>{" "}
                    vehicles
                  </p>
                  {filteredAndSortedVehicles.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">Ready to book</span>
                    </div>
                  )}
                </div>
                {(searchTerm ||
                  Object.values(filters).some((f) => f) ||
                  searchDates.pickupDate ||
                  searchDates.pickupTime) && (
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:col-span-1"
              >
                <div className="sticky top-24">
                  <Card className="bg-white shadow-lg border">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                          <Filter className="inline h-5 w-5 mr-2" />
                          Filters
                        </h3>
                        <Button
                          onClick={() => setShowFilters(false)}
                          variant="ghost"
                          size="sm"
                          className="lg:hidden"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-6">
                        {/* Search Type & Dates Section */}
                        {(searchDates.pickupDate ||
                          searchDates.pickupTime ||
                          isSearchMode) && (
                          <div
                            className={`p-4 rounded-lg border ${
                              searchDates.searchType === "hourly"
                                ? "bg-purple-50 border-purple-200"
                                : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <label
                              className={`block text-sm font-medium mb-3 ${
                                searchDates.searchType === "hourly"
                                  ? "text-purple-800"
                                  : "text-blue-800"
                              }`}
                            >
                              {searchDates.searchType === "hourly" ? (
                                <Clock className="inline h-4 w-4 mr-1" />
                              ) : (
                                <Calendar className="inline h-4 w-4 mr-1" />
                              )}
                              Search{" "}
                              {searchDates.searchType === "hourly"
                                ? "Times"
                                : "Dates"}
                            </label>

                            {/* Search Type Toggle */}
                            <div className="mb-4">
                              <div className="flex bg-white rounded-lg p-1 border">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSearchDateChange(
                                      "searchType",
                                      "daily"
                                    )
                                  }
                                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                                    searchDates.searchType === "daily"
                                      ? "bg-blue-500 text-white"
                                      : "text-gray-600 hover:text-blue-600"
                                  }`}
                                >
                                  <Calendar className="inline h-3 w-3 mr-1" />
                                  Daily
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSearchDateChange(
                                      "searchType",
                                      "hourly"
                                    )
                                  }
                                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                                    searchDates.searchType === "hourly"
                                      ? "bg-purple-500 text-white"
                                      : "text-gray-600 hover:text-purple-600"
                                  }`}
                                >
                                  <Clock className="inline h-3 w-3 mr-1" />
                                  Hourly
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {searchDates.searchType === "hourly"
                                    ? "Date"
                                    : "Pickup Date"}
                                </label>
                                <input
                                  type="date"
                                  value={searchDates.pickupDate}
                                  onChange={(e) =>
                                    handleSearchDateChange(
                                      "pickupDate",
                                      e.target.value
                                    )
                                  }
                                  min={new Date().toISOString().split("T")[0]}
                                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent bg-white text-sm ${
                                    searchDates.searchType === "hourly"
                                      ? "border-purple-300 focus:ring-purple-500"
                                      : "border-blue-300 focus:ring-blue-500"
                                  }`}
                                />
                              </div>

                              {searchDates.searchType === "daily" ? (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Return Date
                                  </label>
                                  <input
                                    type="date"
                                    value={searchDates.returnDate}
                                    onChange={(e) =>
                                      handleSearchDateChange(
                                        "returnDate",
                                        e.target.value
                                      )
                                    }
                                    min={
                                      searchDates.pickupDate ||
                                      new Date().toISOString().split("T")[0]
                                    }
                                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                  />
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Start Time
                                    </label>
                                    <input
                                      type="time"
                                      value={searchDates.pickupTime}
                                      onChange={(e) =>
                                        handleSearchDateChange(
                                          "pickupTime",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      End Time
                                    </label>
                                    <input
                                      type="time"
                                      value={searchDates.returnTime}
                                      onChange={(e) =>
                                        handleSearchDateChange(
                                          "returnTime",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Vehicle Type Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vehicle Type
                          </label>
                          <select
                            value={filters.type}
                            onChange={(e) =>
                              handleFilterChange("type", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="">All Types</option>
                            {filterOptions.types.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Brand Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Brand
                          </label>
                          <select
                            value={filters.brand}
                            onChange={(e) =>
                              handleFilterChange("brand", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="">All Brands</option>
                            {filterOptions.brands.map((brand) => (
                              <option key={brand} value={brand}>
                                {brand}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Location Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          <select
                            value={filters.location}
                            onChange={(e) =>
                              handleFilterChange("location", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="">All Locations</option>
                            {filterOptions.locations.map((location) => (
                              <option key={location} value={location}>
                                {location}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Price Range Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price Range (Per{" "}
                            {searchDates.searchType === "hourly"
                              ? "Hour"
                              : "Day"}
                            )
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              placeholder="Min"
                              value={filters.priceMin}
                              onChange={(e) =>
                                handleFilterChange("priceMin", e.target.value)
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              value={filters.priceMax}
                              onChange={(e) =>
                                handleFilterChange("priceMax", e.target.value)
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            />
                          </div>
                          {priceRange.min > 0 && (
                            <p className="text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                              Available range: {formatPrice(priceRange.min)} -{" "}
                              {formatPrice(priceRange.max)}
                            </p>
                          )}
                        </div>

                        {/* Rating Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Rating
                          </label>
                          <select
                            value={filters.rating}
                            onChange={(e) =>
                              handleFilterChange("rating", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="">Any Rating</option>
                            <option value="4.5">⭐ 4.5+ Excellent</option>
                            <option value="4.0">⭐ 4.0+ Very Good</option>
                            <option value="3.5">⭐ 3.5+ Good</option>
                            <option value="3.0">⭐ 3.0+ Average</option>
                          </select>
                        </div>

                        {/* Availability Filter */}
                        <div>
                          <label className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={filters.available}
                              onChange={(e) =>
                                handleFilterChange(
                                  "available",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">
                              <Zap className="inline h-4 w-4 mr-2 text-green-500" />
                              Available only
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vehicle Grid */}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <LoadingSpinner size="xl" />
                  <p className="mt-4 text-gray-600 font-medium">
                    Loading vehicles...
                  </p>
                </div>
              </div>
            ) : filteredAndSortedVehicles.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-6"
                }
              >
                <AnimatePresence>
                  {filteredAndSortedVehicles.map((vehicle, index) => (
                    <VehicleCard
                      key={vehicle._id}
                      vehicle={vehicle}
                      index={index}
                      viewMode={viewMode}
                      onClick={() => handleVehicleClick(vehicle._id)}
                      onBookClick={(e) => handleBookingClick(vehicle._id, e)}
                      onSaveClick={(e) =>
                        handleSaveVehicle(vehicle._id, vehicle.title, e)
                      }
                      isSaved={isVehicleSaved(vehicle._id)}
                      formatPrice={formatPrice}
                      getVehicleAvailability={getVehicleAvailability}
                      isAuthenticated={isAuthenticated}
                      hasSearchDates={
                        !!(searchDates.pickupDate || searchDates.pickupTime)
                      }
                      searchType={searchDates.searchType}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="mb-8">
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {isSearchMode
                      ? "No vehicles found for your search"
                      : "No vehicles found"}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {isSearchMode
                      ? "Try adjusting your search criteria or dates to find more options."
                      : "We couldn't find any vehicles matching your criteria. Try adjusting your search or filters to discover more options."}
                  </p>
                  <Button
                    onClick={clearFilters}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Vehicle Card Component
const VehicleCard = ({
  vehicle,
  index,
  viewMode,
  onClick,
  onBookClick,
  onSaveClick,
  isSaved,
  formatPrice,
  getVehicleAvailability,
  isAuthenticated,
  hasSearchDates,
  searchType = "daily",
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

  const handleClick = (e) => {
    e.preventDefault();
    onClick();
  };

  // Determine which price to show based on search type
  const getDisplayPrice = () => {
    if (searchType === "hourly" && vehicle.pricePerHour) {
      return {
        price: vehicle.pricePerHour,
        unit: "hour",
        icon: <Clock className="h-3 w-3 mr-1" />,
      };
    }
    return {
      price: vehicle.pricePerDay,
      unit: "day",
      icon: <Calendar className="h-3 w-3 mr-1" />,
    };
  };

  const displayPrice = getDisplayPrice();

  if (viewMode === "list") {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={{ y: -2, scale: 1.01 }}
        onClick={handleClick}
        className="cursor-pointer group"
      >
        <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden">
              {vehicle.images && vehicle.images[0] ? (
                <img
                  src={vehicle.images[0]}
                  alt={vehicle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                  <Search className="h-16 w-16 text-white/80" />
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    vehicle.available
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}
                >
                  <Zap className="inline h-3 w-3 mr-1" />
                  {getVehicleAvailability(vehicle)}
                </span>
              </div>

              {/* Rating Badge */}
              {vehicle.rating && (
                <div className="absolute top-3 left-3">
                  <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm border">
                    <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                    <span className="text-xs font-bold text-gray-800">
                      {vehicle.rating}
                    </span>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onSaveClick}
                className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all border"
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-300 ${
                    isSaved
                      ? "text-red-500 fill-current"
                      : "text-gray-600 hover:text-red-500"
                  }`}
                />
              </motion.button>

              {/* Search Type Indicator */}
              {hasSearchDates && (
                <div className="absolute bottom-3 left-3">
                  <div
                    className={`text-white px-2 py-1 rounded-full text-xs font-medium ${
                      searchType === "hourly" ? "bg-purple-500" : "bg-blue-500"
                    }`}
                  >
                    {searchType === "hourly" ? (
                      <>
                        <Clock className="h-3 w-3 inline mr-1" />
                        Hourly Available
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Daily Available
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="md:w-2/3 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {vehicle.title}
                  </h3>
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                    {vehicle.location}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      searchType === "hourly"
                        ? "text-purple-600"
                        : "text-blue-600"
                    }`}
                  >
                    {formatPrice(displayPrice.price)}
                  </div>
                  <div className="text-sm text-gray-500 font-medium flex items-center justify-end">
                    {displayPrice.icon}
                    per {displayPrice.unit}
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                  {vehicle.brand} • {vehicle.type}
                </span>
              </div>

              {/* Specs */}
              {vehicle.specs && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {vehicle.specs.seats && (
                    <div className="flex items-center text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm font-medium">
                        {vehicle.specs.seats} seats
                      </span>
                    </div>
                  )}
                  {vehicle.specs.fuel && (
                    <div className="flex items-center text-gray-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <Fuel className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm font-medium">
                        {vehicle.specs.fuel}
                      </span>
                    </div>
                  )}
                  {vehicle.specs.transmission && (
                    <div className="flex items-center text-gray-600 bg-purple-50 px-3 py-2 rounded-lg col-span-2 border border-purple-200">
                      <Settings className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="text-sm font-medium">
                        {vehicle.specs.transmission}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Show alternate pricing */}
                  {searchType === "daily" && vehicle.pricePerHour && (
                    <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium border border-purple-200">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatPrice(vehicle.pricePerHour)}/hr
                    </span>
                  )}
                  {searchType === "hourly" && vehicle.pricePerDay && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium border border-blue-200">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatPrice(vehicle.pricePerDay)}/day
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button
                    onClick={onBookClick}
                    size="sm"
                    className={`transition-all ${
                      searchType === "hourly"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    disabled={!vehicle.available}
                  >
                    {displayPrice.icon}
                    {vehicle.available ? "Book Now" : "Not Available"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="cursor-pointer group"
    >
      <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full border">
        <div className="relative h-48 overflow-hidden">
          {vehicle.images && vehicle.images[0] ? (
            <img
              src={vehicle.images[0]}
              alt={vehicle.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
              <Search className="h-12 w-12 text-white/80" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold ${
                vehicle.available
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              <Zap className="inline h-3 w-3 mr-1" />
              {getVehicleAvailability(vehicle)}
            </span>
          </div>

          {/* Rating Badge */}
          {vehicle.rating && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm border">
                <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                <span className="text-xs font-bold">{vehicle.rating}</span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSaveClick}
            className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all border"
          >
            <Heart
              className={`h-4 w-4 transition-all duration-300 ${
                isSaved
                  ? "text-red-500 fill-current"
                  : "text-gray-600 hover:text-red-500"
              }`}
            />
          </motion.button>

          {/* Search Type Indicator */}
          {hasSearchDates && (
            <div className="absolute bottom-3 left-3">
              <div
                className={`text-white px-2 py-1 rounded-full text-xs font-medium ${
                  searchType === "hourly" ? "bg-purple-500" : "bg-blue-500"
                }`}
              >
                {searchType === "hourly" ? (
                  <>
                    <Clock className="h-3 w-3 inline mr-1" />
                    Available
                  </>
                ) : (
                  <>
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Available
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {vehicle.title}
            </h3>
            <p className="text-gray-600 flex items-center text-sm">
              <MapPin className="h-3 w-3 mr-1 text-blue-500" />
              {vehicle.location}
            </p>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
              {vehicle.brand} • {vehicle.type}
            </span>
          </div>

          {/* Specs */}
          {vehicle.specs && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-600">
              {vehicle.specs.seats && (
                <div className="flex items-center bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  <Users className="h-3 w-3 mr-1 text-blue-500" />
                  {vehicle.specs.seats}
                </div>
              )}
              {vehicle.specs.fuel && (
                <div className="flex items-center bg-green-50 px-2 py-1 rounded border border-green-200">
                  <Fuel className="h-3 w-3 mr-1 text-green-500" />
                  {vehicle.specs.fuel}
                </div>
              )}
              {vehicle.specs.transmission && (
                <div className="flex items-center col-span-2 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                  <Settings className="h-3 w-3 mr-1 text-purple-500" />
                  {vehicle.specs.transmission}
                </div>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between">
            <div>
              <div
                className={`text-xl font-bold ${
                  searchType === "hourly" ? "text-purple-600" : "text-blue-600"
                }`}
              >
                {formatPrice(displayPrice.price)}
              </div>
              <div className="text-xs text-gray-500 font-medium flex items-center">
                {displayPrice.icon}
                per {displayPrice.unit}
              </div>
              {/* Show alternate pricing */}
              {searchType === "daily" && vehicle.pricePerHour && (
                <div className="text-xs text-purple-600">
                  {formatPrice(vehicle.pricePerHour)}/hr
                </div>
              )}
              {searchType === "hourly" && vehicle.pricePerDay && (
                <div className="text-xs text-blue-600">
                  {formatPrice(vehicle.pricePerDay)}/day
                </div>
              )}
            </div>
            <Button
              onClick={onBookClick}
              size="sm"
              disabled={!vehicle.available}
              className={`transition-all ${
                searchType === "hourly"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {displayPrice.icon}
              {vehicle.available ? "Book" : "Unavailable"}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default VehicleListingPage;

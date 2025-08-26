// pages/admin/AdminVehicles.jsx
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  Plus,
  Car,
  MapPin,
  Star,
  Eye,
  Edit,
  Trash2,
  X,
  Upload,
  Save,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import axios from "../../axiosConfig";
import toast from "react-hot-toast";

const AdminVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [createForm, setCreateForm] = useState({
    title: "",
    brand: "",
    type: "",
    pricePerDay: "",
    pricePerHour: "",
    location: "",
    specs: {
      transmission: "",
      seats: "",
      fuel: "",
      features: [],
    },
    images: [],
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  // Fetch vehicles
  const fetchVehicles = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await axios.get("/api/vehicles");
      setVehicles(response.data);
      if (showRefreshing) {
        toast.success("Vehicles data refreshed successfully!");
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to fetch vehicles");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Calculate vehicle stats
  const vehicleStatsCalculated = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter((v) => v.available).length;
    const booked = vehicles.filter((v) => !v.available).length;
    const avgRating =
      vehicles.reduce((sum, v) => sum + (v.rating || 0), 0) / total || 0;

    return { total, available, booked, avgRating: avgRating.toFixed(1) };
  }, [vehicles]);

  const filterOptions = {
    types: [...new Set(vehicles.map((v) => v.type).filter(Boolean))],
  };

  // Toggle vehicle availability
  const toggleAvailability = async (vehicleId, currentStatus) => {
    const vehicle = vehicles.find((v) => v._id === vehicleId);
    const newStatus = !currentStatus;
    const confirmed = window.confirm(
      `Are you sure you want to mark "${vehicle?.title}" as ${
        newStatus ? "Available" : "Booked"
      }?`
    );
    if (!confirmed) return;

    setProcessing(vehicleId);
    try {
      await axios.put(`/api/vehicles/${vehicleId}`, { available: newStatus });
      const updated = vehicles.map((v) =>
        v._id === vehicleId ? { ...v, available: newStatus } : v
      );
      setVehicles(updated);
      toast.success(`Vehicle marked as ${newStatus ? "Available" : "Booked"}`);
    } catch (error) {
      console.error("Error updating vehicle availability:", error);
      toast.error("Failed to update vehicle availability");
    } finally {
      setProcessing(null);
    }
  };

  // Filtered and sorted vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = [...vehicles];

    // Apply search filter
    if (search) {
      filtered = filtered.filter((vehicle) =>
        `${vehicle.title} ${vehicle.brand} ${vehicle.type} ${vehicle.location}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((vehicle) => vehicle.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "available") {
        filtered = filtered.filter((vehicle) => vehicle.available);
      } else if (statusFilter === "booked") {
        filtered = filtered.filter((vehicle) => !vehicle.available);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";

      if (
        sortBy === "pricePerDay" ||
        sortBy === "pricePerHour" ||
        sortBy === "rating"
      ) {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortBy === "createdAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
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
  }, [vehicles, search, typeFilter, statusFilter, sortBy, sortOrder]);

  // Handle image upload
  const handleImageUpload = async (files, isEdit = false) => {
    setUploadingImages(true);
    const uploadPromises = Array.from(files).map((file) =>
      uploadToCloudinary(file)
    );

    try {
      const urls = await Promise.all(uploadPromises);
      if (isEdit) {
        setEditForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), ...urls],
        }));
      } else {
        setCreateForm((prev) => ({
          ...prev,
          images: [...prev.images, ...urls],
        }));
      }
      toast.success(`${urls.length} image(s) uploaded successfully!`);
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  // Handle create vehicle
  const handleCreateVehicle = async () => {
    if (!createForm.title || !createForm.brand || !createForm.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setProcessing("create");
    try {
      const response = await axios.post("/api/vehicles", {
        ...createForm,
        pricePerDay: Number(createForm.pricePerDay),
        pricePerHour: Number(createForm.pricePerHour),
        specs: {
          ...createForm.specs,
          features: createForm.specs.features.filter((f) => f.trim()),
        },
      });

      setVehicles([...vehicles, response.data]);
      setShowCreateModal(false);
      setCreateForm({
        title: "",
        brand: "",
        type: "",
        pricePerDay: "",
        pricePerHour: "",
        location: "",
        specs: {
          transmission: "",
          seats: "",
          fuel: "",
          features: [],
        },
        images: [],
      });
      toast.success("Vehicle created successfully");
    } catch (error) {
      console.error("Error creating vehicle:", error);
      toast.error("Failed to create vehicle");
    } finally {
      setProcessing(null);
    }
  };

  // Handle update vehicle
  const handleUpdateVehicle = async () => {
    setProcessing("update");
    try {
      const response = await axios.put(`/api/vehicles/${editForm._id}`, {
        ...editForm,
        pricePerDay: Number(editForm.pricePerDay),
        pricePerHour: Number(editForm.pricePerHour),
      });

      const updated = vehicles.map((v) =>
        v._id === editForm._id ? response.data : v
      );
      setVehicles(updated);
      setShowEditModal(false);
      toast.success("Vehicle updated successfully");
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast.error("Failed to update vehicle");
    } finally {
      setProcessing(null);
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async (vehicleId, vehicleName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${vehicleName}"?`
    );
    if (!confirmed) return;

    setProcessing(vehicleId);
    try {
      await axios.delete(`/api/vehicles/${vehicleId}`);
      setVehicles(vehicles.filter((v) => v._id !== vehicleId));
      toast.success("Vehicle deleted successfully");
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("Failed to delete vehicle");
    } finally {
      setProcessing(null);
    }
  };

  // Export vehicles
  const exportVehicles = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Title,Brand,Type,Price/Day,Price/Hour,Location,Available,Rating\n" +
      filteredAndSortedVehicles
        .map(
          (vehicle) =>
            `"${vehicle.title}","${vehicle.brand}","${vehicle.type}",${
              vehicle.pricePerDay
            },${vehicle.pricePerHour},"${vehicle.location}",${
              vehicle.available ? "Yes" : "No"
            },${vehicle.rating || 0}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vehicles_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Vehicles exported successfully!");
  };

  const getStatusColor = (available) => {
    return available
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getStatusIcon = (available) => {
    return available ? CheckCircle : XCircle;
  };

  if (loading) {
    return (
      <AdminLayout
        title="Vehicle Management"
        subtitle="Manage your fleet with advanced controls"
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <LoadingSpinner size="xl" className="py-20" />
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Vehicle Management"
      subtitle="Manage your fleet with advanced controls"
      // onRefresh={() => fetchVehicles(true)}
      // refreshing={refreshing}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header with Stats */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-xl text-white overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">
                  Fleet Analytics
                </h2>
                <p className="text-blue-100 text-sm sm:text-base">
                  Monitor and manage your vehicle inventory
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportVehicles}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Vehicles",
                  value: vehicleStatsCalculated.total,
                  icon: Car,
                  change: "+5%",
                },
                {
                  label: "Available",
                  value: vehicleStatsCalculated.available,
                  icon: CheckCircle,
                  change: "+3%",
                },
                {
                  label: "Booked",
                  value: vehicleStatsCalculated.booked,
                  icon: Clock,
                  change: "+12%",
                },
                {
                  label: "Avg Rating",
                  value: vehicleStatsCalculated.avgRating,
                  icon: Star,
                  change: "+0.2",
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
                      <p className="text-blue-100 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 text-green-300 mr-1" />
                        <span className="text-xs text-green-300">
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <stat.icon className="h-8 w-8 text-blue-200" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* Filters and Search */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles by name, brand, type, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/70"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 w-full sm:w-auto"
                >
                  <option value="all">All Types</option>
                  {filterOptions.types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 w-full sm:w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-gray-200 w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
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
                  <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white w-full sm:w-auto"
                      >
                        <option value="title">Title</option>
                        <option value="brand">Brand</option>
                        <option value="type">Type</option>
                        <option value="pricePerDay">Price (Daily)</option>
                        <option value="rating">Rating</option>
                        <option value="createdAt">Date Added</option>
                      </select>
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order
                      </label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white w-full sm:w-auto"
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAndSortedVehicles.map((vehicle, index) => {
              const StatusIcon = getStatusIcon(vehicle.available);
              return (
                <motion.div
                  key={vehicle._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Vehicle Image */}
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <img
                          src={vehicle.images[0]}
                          alt={vehicle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Car className="h-16 w-16 text-gray-400" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            vehicle.available
                          )}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {vehicle.available ? "Available" : "Booked"}
                        </span>
                      </div>

                      {/* Rating Badge */}
                      {vehicle.rating && (
                        <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full flex items-center">
                          <Star className="h-3 w-3 mr-1 fill-current text-yellow-400" />
                          <span className="text-xs font-medium">
                            {vehicle.rating}
                          </span>
                        </div>
                      )}

                      {/* Availability Toggle */}
                      <div className="absolute bottom-3 right-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleAvailability(vehicle._id, vehicle.available)
                          }
                          disabled={processing === vehicle._id}
                          className="bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 border-0 shadow-lg"
                          title={`Toggle to ${
                            vehicle.available ? "Booked" : "Available"
                          }`}
                        >
                          {processing === vehicle._id ? (
                            <LoadingSpinner size="sm" />
                          ) : vehicle.available ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {vehicle.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {vehicle.brand} • {vehicle.type}
                        </p>
                      </div>

                      {/* Location */}
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {vehicle.location}
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {vehicle.pricePerDay && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">
                                ₹{vehicle.pricePerDay}
                              </p>
                              <p className="text-xs text-gray-500">per day</p>
                            </div>
                          )}
                          {vehicle.pricePerHour && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600">
                                ₹{vehicle.pricePerHour}
                              </p>
                              <p className="text-xs text-gray-500">per hour</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowVehicleModal(true);
                          }}
                          className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditForm(vehicle);
                            setShowEditModal(true);
                          }}
                          className="flex-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteVehicle(vehicle._id, vehicle.title)
                          }
                          disabled={processing === vehicle._id}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          {processing === vehicle._id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredAndSortedVehicles.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No vehicles found
              </h3>
              <p className="text-gray-500 mb-4">
                No vehicles match your current search criteria.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Vehicle
              </Button>
            </div>
          </Card>
        )}

        {/* Vehicle Details Modal */}
        <Modal
          isOpen={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
          title="Vehicle Details"
          size="lg"
        >
          {selectedVehicle && (
            <div className="space-y-6">
              {/* Vehicle Images */}
              {selectedVehicle.images && selectedVehicle.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedVehicle.images.slice(0, 4).map((image, i) => (
                    <img
                      key={i}
                      src={image}
                      alt={`${selectedVehicle.title} ${i + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Vehicle Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedVehicle.title}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Brand
                    </label>
                    <p className="text-gray-900">{selectedVehicle.brand}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <p className="text-gray-900">{selectedVehicle.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <p className="text-gray-900">{selectedVehicle.location}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Daily Price
                    </label>
                    <p className="text-gray-900 font-medium">
                      ₹{selectedVehicle.pricePerDay}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hourly Price
                    </label>
                    <p className="text-gray-900 font-medium">
                      ₹{selectedVehicle.pricePerHour}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rating
                    </label>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-gray-900">
                        {selectedVehicle.rating || "No rating"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        selectedVehicle.available
                      )}`}
                    >
                      {selectedVehicle.available ? "Available" : "Booked"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              {selectedVehicle.specs && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Transmission:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedVehicle.specs.transmission || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Seats:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedVehicle.specs.seats || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Fuel:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedVehicle.specs.fuel || "N/A"}
                      </span>
                    </div>
                    {selectedVehicle.specs.features &&
                      selectedVehicle.specs.features.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-sm font-medium text-gray-700">
                            Features:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedVehicle.specs.features.map(
                              (feature, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {feature}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowVehicleModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setEditForm(selectedVehicle);
                    setShowVehicleModal(false);
                    setShowEditModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Edit Vehicle
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Create Vehicle Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New Vehicle"
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="BMW X5 2023"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand *
                </label>
                <input
                  type="text"
                  value={createForm.brand}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      brand: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="BMW"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="SUV">SUV</option>
                  <option value="Bike">Bike</option>
                  <option value="Cycle">Cycle</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Sports">Sports</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Day (₹)
                </label>
                <input
                  type="number"
                  value={createForm.pricePerDay}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      pricePerDay: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Hour (₹)
                </label>
                <input
                  type="number"
                  value={createForm.pricePerHour}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      pricePerHour: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="200"
                />
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transmission
                  </label>
                  <select
                    value={createForm.specs.transmission}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        specs: { ...prev.specs, transmission: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Transmission</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seats
                  </label>
                  <select
                    value={createForm.specs.seats}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        specs: { ...prev.specs, seats: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Seats</option>
                    <option value="2 Seats">2 Seats</option>
                    <option value="4 Seats">4 Seats</option>
                    <option value="5 Seats">5 Seats</option>
                    <option value="7 Seats">7 Seats</option>
                    <option value="8+ Seats">8+ Seats</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={createForm.specs.fuel}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        specs: { ...prev.specs, fuel: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Features (comma separated)
              </label>
              <textarea
                value={createForm.specs.features.join(", ")}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    specs: {
                      ...prev.specs,
                      features: e.target.value
                        .split(",")
                        .map((f) => f.trim())
                        .filter((f) => f),
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="GPS Navigation, Bluetooth, Air Conditioning, Premium Sound"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="create-images"
                />
                <label htmlFor="create-images" className="cursor-pointer">
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </label>
              </div>

              {/* Image Preview */}
              {createForm.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {createForm.images.map((image, i) => (
                    <div key={i} className="relative">
                      <img
                        src={image}
                        alt={`Preview ${i + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() =>
                          setCreateForm((prev) => ({
                            ...prev,
                            images: prev.images.filter(
                              (_, index) => index !== i
                            ),
                          }))
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={processing === "create"}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateVehicle}
                disabled={processing === "create" || uploadingImages}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {processing === "create" ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : uploadingImages ? (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Vehicle
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Vehicle Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Vehicle"
          size="xl"
        >
          {editForm && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editForm.title || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    value={editForm.brand || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        brand: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={editForm.type || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Sports">Sports</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={editForm.location || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Day (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.pricePerDay || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        pricePerDay: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Hour (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.pricePerHour || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        pricePerHour: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Availability Toggle */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Vehicle Availability
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Toggle vehicle availability for bookings
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setEditForm((prev) => ({
                        ...prev,
                        available: !prev.available,
                      }))
                    }
                    className={`p-2 rounded-lg transition-all ${
                      editForm.available
                        ? "bg-green-100 hover:bg-green-200 text-green-700"
                        : "bg-red-100 hover:bg-red-200 text-red-700"
                    }`}
                  >
                    {editForm.available ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Available
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 mr-2" />
                        Booked
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Image Upload for Edit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files, true)}
                    className="hidden"
                    id="edit-images"
                  />
                  <label htmlFor="edit-images" className="cursor-pointer">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click to upload more images</p>
                  </label>
                </div>

                {/* Current Images */}
                {editForm.images && editForm.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {editForm.images.map((image, i) => (
                      <div key={i} className="relative">
                        <img
                          src={image}
                          alt={`Image ${i + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() =>
                            setEditForm((prev) => ({
                              ...prev,
                              images: prev.images.filter(
                                (_, index) => index !== i
                              ),
                            }))
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={processing === "update"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateVehicle}
                  disabled={processing === "update" || uploadingImages}
                  className="bg-gradient-to-r from-green-600 to-green-700"
                >
                  {processing === "update" ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : uploadingImages ? (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Vehicle
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminVehicles;

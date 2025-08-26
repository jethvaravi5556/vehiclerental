// contexts/VehicleContext.jsx
import { createContext, useContext, useState, useEffect } from "react"
import axios from "../axiosConfig"
import toast from "react-hot-toast"

const VehicleContext = createContext()

export const useVehicle = () => {
  const context = useContext(VehicleContext)
  if (!context) {
    throw new Error("useVehicle must be used within a VehicleProvider")
  }
  return context
}

export const VehicleProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({})
  const [availableVehicles, setAvailableVehicles] = useState([])
  const [savedVehicles, setSavedVehicles] = useState(new Set())
  const [savedVehiclesData, setSavedVehiclesData] = useState([])
  const [vehicleStats, setVehicleStats] = useState({
    total: 0,
    available: 0,
    booked: 0,
    maintenance: 0
  })

  // Fetch all vehicles
  const fetchVehicles = async (filterParams = {}) => {
    setLoading(true)
    try {
      const response = await axios.get("/api/vehicles", { params: filterParams })
      setVehicles(response.data)
      setFilters(filterParams)
      
      // Calculate stats
      const stats = {
        total: response.data.length,
        available: response.data.filter(v => v.available).length,
        booked: response.data.filter(v => !v.available).length,
        maintenance: 0
      }
      setVehicleStats(stats)
      
      return response.data
    } catch (error) {
      console.error("Failed to fetch vehicles:", error)
      // toast.error("Failed to fetch vehicles")
      return []
    } finally {
      setLoading(false)
    }
  }

  // Fetch available vehicles with booking filters
  const fetchAvailableVehicles = async (bookingFilters) => {
    setLoading(true)
    try {
      const response = await axios.get("/api/vehicles/available", { 
        params: bookingFilters 
      })
      setAvailableVehicles(response.data)
      return response.data
    } catch (error) {
      console.error("Failed to fetch available vehicles:", error)
      const errorMessage = error.response?.data?.message || "Failed to fetch available vehicles"
      toast.error(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Get vehicle by ID
  const getVehicleById = async (id) => {
    try {
      const response = await axios.get(`/api/vehicles/${id}`)
      return response.data
    } catch (error) {
      console.error("Failed to fetch vehicle:", error)
      // toast.error("Failed to fetch vehicle details")
      return null
    }
  }

  // Create vehicle (admin only)
  const createVehicle = async (vehicleData) => {
    setLoading(true)
    try {
      const response = await axios.post("/api/vehicles", vehicleData)
      await fetchVehicles(filters)
      toast.success("Vehicle added successfully!")
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Failed to create vehicle:", error)
      const errorMessage = error.response?.data?.message || "Failed to add vehicle"
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Update vehicle (admin only)
  const updateVehicle = async (id, vehicleData) => {
    try {
      const response = await axios.put(`/api/vehicles/${id}`, vehicleData)
      await fetchVehicles(filters)
      toast.success("Vehicle updated successfully!")
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Failed to update vehicle:", error)
      const errorMessage = error.response?.data?.message || "Failed to update vehicle"
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Delete vehicle (admin only)
  const deleteVehicle = async (id) => {
    try {
      await axios.delete(`/api/vehicles/${id}`)
      await fetchVehicles(filters)
      toast.success("Vehicle deleted successfully!")
      return { success: true }
    } catch (error) {
      console.error("Failed to delete vehicle:", error)
      const errorMessage = error.response?.data?.message || "Failed to delete vehicle"
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Search vehicles
  const searchVehicles = async (searchTerm) => {
    if (!searchTerm.trim()) {
      return await fetchVehicles()
    }
    
    const filtered = vehicles.filter(vehicle => 
      vehicle.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    setVehicles(filtered)
    return filtered
  }

  // Get unique values for filters
  const getFilterOptions = () => {
    const brands = [...new Set(vehicles.map(v => v.brand).filter(Boolean))]
    const types = [...new Set(vehicles.map(v => v.type).filter(Boolean))]
    const locations = [...new Set(vehicles.map(v => v.location).filter(Boolean))]
    
    return { brands, types, locations }
  }

  // Get price range
  const getPriceRange = () => {
    if (vehicles.length === 0) return { min: 0, max: 1000 }
    
    const dailyPrices = vehicles.map(v => v.pricePerDay).filter(Boolean)
    const hourlyPrices = vehicles.map(v => v.pricePerHour).filter(Boolean)
    
    const allPrices = [...dailyPrices, ...hourlyPrices.map(p => p * 24)]
    
    return {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices)
    }
  }

  // Apply filters to vehicles
  const applyFilters = async (filterParams) => {
    return await fetchVehicles(filterParams)
  }

  // Get vehicle availability status
  const getVehicleAvailability = (vehicle) => {
    return vehicle.available ? 'Available' : 'Booked'
  }

  // Format price display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Fetch saved vehicles with complete data
  const fetchSavedVehicles = async () => {
    try {
      const response = await axios.get("/api/auth/saved", { withCredentials: true })
      const savedData = response.data || []
      setSavedVehiclesData(savedData)
      
      // Update the Set of saved vehicle IDs
      const savedIds = savedData.map(v => v._id)
      setSavedVehicles(new Set(savedIds))
      
      return savedData
    } catch (error) {
      console.error("Failed to fetch saved vehicles:", error)
      // if (error.response?.status !== 401) {
      //   toast.error("Failed to load saved vehicles")
      // }
      return []
    }
  }

  // Toggle saved vehicle with optimistic updates - Enhanced for all pages
  const toggleSaveVehicle = async (vehicleId, vehicleTitle = '', fromPage = '') => {
    const wasAlreadySaved = savedVehicles.has(vehicleId)
    
    // Optimistic update
    setSavedVehicles(prev => {
      const updated = new Set(prev)
      if (wasAlreadySaved) {
        updated.delete(vehicleId)
      } else {
        updated.add(vehicleId)
      }
      return updated
    })

    try {
      const response = await axios.post(
        `/api/auth/toggle-save/${vehicleId}`, 
        {}, 
        { withCredentials: true }
      )
      
      const isNowSaved = response.data.saved
      const vehicleName = vehicleTitle || 'Vehicle'

      // Show appropriate toast message
      if (isNowSaved) {
        toast.success(`${vehicleName} saved to favorites`, {
          icon: "❤️",
          style: {
            borderRadius: '10px',
            background: '#10B981',
            color: '#fff',
          },
        })
      } else {
        toast.success(`${vehicleName} removed from favorites`, {
          icon: "💔",
          style: {
            borderRadius: '10px',
            background: '#EF4444',
            color: '#fff',
          },
        })
      }

      // Update saved vehicles data if needed
      if (isNowSaved) {
        // If vehicle was just saved, we might need to fetch updated saved vehicles data
        // This ensures we have complete vehicle info in saved vehicles list
        await fetchSavedVehicles()
      } else {
        // Remove from saved vehicles data
        setSavedVehiclesData(prev => prev.filter(v => v._id !== vehicleId))
      }

      // Ensure our state matches the server response
      setSavedVehicles(prev => {
        const updated = new Set(prev)
        if (isNowSaved) {
          updated.add(vehicleId)
        } else {
          updated.delete(vehicleId)
        }
        return updated
      })

      return { success: true, saved: isNowSaved }
    } catch (error) {
      console.error("Failed to toggle saved vehicle:", error)
      
      // Revert optimistic update on error
      setSavedVehicles(prev => {
        const updated = new Set(prev)
        if (wasAlreadySaved) {
          updated.add(vehicleId)
        } else {
          updated.delete(vehicleId)
        }
        return updated
      })

      const errorMessage = error.response?.data?.message || "Failed to update saved vehicles"
      toast.error(errorMessage, {
        icon: "❌",
        style: {
          borderRadius: '10px',
          background: '#EF4444',
          color: '#fff',
        },
      })
      
      return { success: false, error: errorMessage }
    }
  }

  // Check if vehicle is saved
  const isVehicleSaved = (vehicleId) => {
    return savedVehicles.has(vehicleId)
  }

  // Get saved vehicle count
  const getSavedVehicleCount = () => {
    return savedVehicles.size
  }

  // Clear all saved vehicles
  const clearAllSavedVehicles = async () => {
    try {
      // This would need a backend endpoint to clear all saved vehicles
      // For now, we'll iterate through all saved vehicles
      const promises = Array.from(savedVehicles).map(vehicleId => 
        toggleSaveVehicle(vehicleId)
      )
      
      await Promise.all(promises)
      
      toast.success("All saved vehicles cleared", {
        icon: "🗑️",
        style: {
          borderRadius: '10px',
          background: '#6B7280',
          color: '#fff',
        },
      })
      
      return { success: true }
    } catch (error) {
      console.error("Failed to clear saved vehicles:", error)
      toast.error("Failed to clear saved vehicles")
      return { success: false, error: error.message }
    }
  }

  // Initialize vehicles and saved vehicles on mount
  useEffect(() => {
    fetchVehicles()
    fetchSavedVehicles()
  }, [])

  const value = {
    vehicles,
    availableVehicles,
    loading,
    filters,
    vehicleStats,
    savedVehicles,
    savedVehiclesData,
    fetchVehicles,
    fetchAvailableVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    searchVehicles,
    getFilterOptions,
    getPriceRange,
    applyFilters,
    getVehicleAvailability,
    formatPrice,
    fetchSavedVehicles,
    toggleSaveVehicle,
    isVehicleSaved,
    getSavedVehicleCount,
    clearAllSavedVehicles,
  }

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>
}
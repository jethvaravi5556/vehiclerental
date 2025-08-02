import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Mock data for development
const mockVehicles = [
  {
    _id: "1",
    title: "BMW X5 2023",
    brand: "BMW",
    type: "SUV",
    pricePerDay: 150,
    pricePerHour: 25,
    location: "New York",
    rating: 4.8,
    reviewCount: 24,
    images: ["/placeholder.svg?height=300&width=400"],
    specs: ["Automatic", "5 Seats", "Diesel", "GPS"],
    availability: true,
  },
  {
    _id: "2",
    title: "Tesla Model S",
    brand: "Tesla",
    type: "Luxury",
    pricePerDay: 200,
    pricePerHour: 35,
    location: "Los Angeles",
    rating: 4.9,
    reviewCount: 18,
    images: ["/placeholder.svg?height=300&width=400"],
    specs: ["Electric", "5 Seats", "Autopilot", "Premium Sound"],
    availability: true,
  },
  {
    _id: "3",
    title: "Honda Civic 2023",
    brand: "Honda",
    type: "Car",
    pricePerDay: 80,
    pricePerHour: 15,
    location: "Chicago",
    rating: 4.5,
    reviewCount: 32,
    images: ["/placeholder.svg?height=300&width=400"],
    specs: ["Manual", "5 Seats", "Petrol", "Bluetooth"],
    availability: true,
  },
]

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor with mock data fallback
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // If API is not available, return mock data for development
    if (error.code === "ERR_NETWORK") {
      const url = error.config.url

      if (url.includes("/vehicles/featured") || url.includes("/vehicles")) {
        return Promise.resolve({
          data: { vehicles: mockVehicles },
        })
      }

      if (url.includes("/auth/profile")) {
        return Promise.reject(error) // Let auth handle this
      }
    }

    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile"),
}

// Vehicle API
export const vehicleAPI = {
  getAll: (params) => api.get("/vehicles", { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (vehicleData) => api.post("/vehicles", vehicleData),
  update: (id, vehicleData) => api.put(`/vehicles/${id}`, vehicleData),
  delete: (id) => api.delete(`/vehicles/${id}`),
  getFeatured: () => api.get("/vehicles/featured"),
}

// Booking API
export const bookingAPI = {
  create: (bookingData) => api.post("/bookings", bookingData),
  getUserBookings: () => api.get("/bookings/user"),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  getAll: () => api.get("/bookings"), // Admin only
}

// Review API
export const reviewAPI = {
  create: (reviewData) => api.post("/reviews", reviewData),
  getByVehicle: (vehicleId) => api.get(`/reviews/vehicle/${vehicleId}`),
  update: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  delete: (id) => api.delete(`/reviews/${id}`),
}

// User API
export const userAPI = {
  getAll: () => api.get("/users"), // Admin only
  updateRole: (userId, role) => api.patch(`/users/${userId}/role`, { role }),
  getSavedVehicles: () => api.get("/users/saved-vehicles"),
  saveVehicle: (vehicleId) => api.post(`/users/save-vehicle/${vehicleId}`),
  removeSavedVehicle: (vehicleId) => api.delete(`/users/save-vehicle/${vehicleId}`),
}

// Chatbot API
export const chatbotAPI = {
  sendMessage: (message) =>
    Promise.resolve({
      data: {
        message:
          "Thanks for your message! This is a demo response. Our support team will help you with vehicle rentals, bookings, and any questions you have.",
      },
    }),
}

// Payment API
export const paymentAPI = {
  createPaymentIntent: (amount) => api.post("/payment/create-intent", { amount }),
  confirmPayment: (paymentIntentId) => api.post("/payment/confirm", { paymentIntentId }),
}

export default api

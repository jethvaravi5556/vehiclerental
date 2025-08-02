// components/layout/AdminLayout.jsx
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Users,
  Car,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  Activity,
  RefreshCw
} from "lucide-react"
import Card from "../ui/Card"
import Button from "../ui/Button"
import LoadingSpinner from "../ui/LoadingSpinner"

const AdminLayout = ({ children, onRefresh, refreshing = false, title, subtitle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentSection, setCurrentSection] = useState("overview")

  const sidebarItems = [
    { name: "Overview", key: "overview", icon: BarChart3, color: "text-blue-600", path: "/admin" },
    { name: "Users", key: "users", icon: Users, color: "text-green-600", path: "/admin/users" },
    { name: "Vehicles", key: "vehicles", icon: Car, color: "text-purple-600", path: "/admin/vehicles" },
    { name: "Bookings", key: "bookings", icon: Calendar, color: "text-orange-600", path: "/admin/bookings" },
    { name: "Settings", key: "settings", icon: Settings, color: "text-gray-600", path: "/admin/settings" }
  ]

  // Determine current section based on URL
  useEffect(() => {
    const path = location.pathname
    if (path === "/admin") {
      setCurrentSection("overview")
    } else if (path.includes("/users")) {
      setCurrentSection("users")
    } else if (path.includes("/vehicles")) {
      setCurrentSection("vehicles")
    } else if (path.includes("/bookings")) {
      setCurrentSection("bookings")
    } else if (path.includes("/settings")) {
      setCurrentSection("settings")
    }
  }, [location.pathname])

  const handleNavigation = (item) => {
    setCurrentSection(item.key)
    navigate(item.path)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg mr-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {title || "Admin Dashboard"}
              </h1>
              <p className="text-gray-600 mt-1">{subtitle || "Manage your vehicle rental platform with ease"}</p>
            </div>
          </div>
          {onRefresh && (
            <Button 
              onClick={onRefresh} 
              disabled={refreshing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {refreshing ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-24 overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <nav className="space-y-1 p-2">
                {sidebarItems.map((item, index) => (
                  <motion.button
                    key={item.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigation(item)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left relative overflow-hidden ${
                      currentSection === item.key
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <item.icon className={`h-5 w-5 ${currentSection === item.key ? 'text-white' : item.color}`} />
                    <span className="font-medium">{item.name}</span>
                    {currentSection === item.key && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AdminLayout
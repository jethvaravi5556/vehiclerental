// pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  Users,
  Car,
  Calendar,
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
  Filter,
  Download,
  MessageCircle,
  UserCheck
} from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"
import Card from "../../components/ui/Card"
import Button from "../../components/ui/Button"
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import { useChat } from "../../contexts/ChatContext"
import axios from "../../axiosConfig"
import toast from "react-hot-toast"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { unreadCount, onlineUsers, isConnected } = useChat()
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    revenue: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    revenueGrowth: 0
  })
  const [users, setUsers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAdminData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    
    try {
      const [usersRes, bookingsRes, vehiclesRes] = await Promise.all([
        axios.get("/api/admin/users"),
        axios.get("/api/admin/bookings"),
        axios.get("/api/vehicles")
      ])

      const bookingData = bookingsRes.data
      const totalRevenue = bookingData.reduce((sum, b) => sum + (b.amountPaid || 0), 0)
      const activeBookings = bookingData.filter(b => b.status === "confirmed").length
      const completedBookings = bookingData.filter(b => b.status === "completed").length
      const cancelledBookings = bookingData.filter(b => b.status === "cancelled").length

      setUsers(usersRes.data)
      setBookings(bookingData)
      setVehicles(vehiclesRes.data)
      setStats({
        totalUsers: usersRes.data.length,
        totalVehicles: vehiclesRes.data.length,
        totalBookings: bookingData.length,
        revenue: totalRevenue,
        activeBookings,
        completedBookings,
        cancelledBookings,
        revenueGrowth: 12.5 // Mock growth percentage
      })

      if (showRefreshing) {
        toast.success("Data refreshed successfully!")
      }
    } catch (err) {
      console.error("Error fetching admin data", err)
      toast.error("Failed to fetch admin data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleQuickAction = (action) => {
    switch (action) {
      case "users":
        navigate("/admin/users")
        break
      case "vehicles":
        navigate("/admin/vehicles")
        break
      case "bookings":
        navigate("/admin/bookings")
        break
      case "chat":
        navigate("/admin/chat")
        break
      default:
        break
    }
  }

  return (
    <AdminLayout 
      title="Admin Dashboard"
      subtitle="Manage your vehicle rental platform with ease"
      onRefresh={() => fetchAdminData(true)}
      refreshing={refreshing}
    >
      <AdminOverview 
        stats={stats} 
        loading={loading} 
        onRefresh={() => fetchAdminData(true)} 
        refreshing={refreshing}
        onQuickAction={handleQuickAction}
        unreadCount={unreadCount}
        onlineUsers={onlineUsers}
        isConnected={isConnected}
      />
    </AdminLayout>
  )
}

const AdminOverview = ({ 
  stats, 
  loading, 
  onRefresh, 
  refreshing, 
  onQuickAction, 
  unreadCount, 
  onlineUsers, 
  isConnected 
}) => {
  if (loading) return <LoadingSpinner size="xl" className="py-20" />

  const statCards = [
    { 
      title: "Total Users", 
      value: stats.totalUsers, 
      icon: Users, 
      color: "from-blue-600 to-blue-700",
      bgColor: "bg-blue-50",
      change: "+12%",
      trend: "up"
    },
    { 
      title: "Total Vehicles", 
      value: stats.totalVehicles, 
      icon: Car, 
      color: "from-green-600 to-green-700",
      bgColor: "bg-green-50",
      change: "+8%",
      trend: "up"
    },
    { 
      title: "Active Bookings", 
      value: stats.activeBookings, 
      icon: Calendar, 
      color: "from-purple-600 to-purple-700",
      bgColor: "bg-purple-50",
      change: "+15%",
      trend: "up"
    },
    { 
      title: "Revenue", 
      value: `₹${stats.revenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: "from-orange-600 to-orange-700",
      bgColor: "bg-orange-50",
      change: `+${stats.revenueGrowth}%`,
      trend: "up"
    }
  ]

  const bookingStats = [
    { label: "Total Bookings", value: stats.totalBookings, color: "text-blue-600" },
    { label: "Completed", value: stats.completedBookings, color: "text-green-600" },
    { label: "Cancelled", value: stats.cancelledBookings, color: "text-red-600" }
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="group cursor-pointer"
          >
            <Card className={`${stat.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative`}>
              <div className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">{stat.change}</span>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chat Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 shadow-xl text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Chat Support</h3>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      <span>{onlineUsers.length} users online</span>
                    </div>
                    {unreadCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span>{unreadCount} unread messages</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onQuickAction("chat")}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 relative"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Open Chat
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Booking Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Booking Analytics</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="border-gray-200">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bookingStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-xl text-white">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                variant="secondary" 
                onClick={() => onQuickAction("users")}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => onQuickAction("vehicles")}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Car className="h-4 w-4 mr-2" />
                Manage Vehicles
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => onQuickAction("bookings")}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Bookings
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => onQuickAction("chat")}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 relative"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat Support
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default AdminDashboard
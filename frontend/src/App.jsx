import { BrowserRouter as Router, Routes, Route, useSearchParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./contexts/AuthContext";
// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
import { VehicleProvider } from "./contexts/VehicleContext";
import { BookingProvider } from "./contexts/BookingContext";
import { ChatProvider } from "./contexts/ChatContext";

// Layout
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ChatbotWidget from "./components/chatbot/ChatbotWidget";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import VerifyOtpPage from "./pages/auth/VerifyOtpPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VehicleListingPage from "./pages/VehicleListingPage";
import VehicleDetailsPage from "./pages/VehicleDetailsPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import SavedVehiclesPage from "./pages/SavedVehiclesPage";

// Admin Pages
import AdminDashboard from "../src/pages/admin/AdminDashboard";
import AdminUsers from "../src/pages/admin/AdminUsers";
import AdminVehicles from "../src/pages/admin/AdminVehicles";
import AdminBookings from "../src/pages/admin/AdminBookings";

// Chat Pages and Components
import ChatWidget from "./components/chat/ChatWidget";
import AdminChatPage from "./pages/admin/AdminChatPage";
import UserChatPage from "./components/chat/UserChatPage";

// Wrapper components to handle query parameters
const VehicleDetailsWrapper = () => {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  
  return <VehicleDetailsPage vehicleId={vehicleId} navigate={(path, params) => {
    if (params?.vehicleId) {
      window.location.href = `/${path}?vehicleId=${params.vehicleId}`;
    } else {
      window.location.href = `/${path}`;
    }
  }} />;
};

const BookingWrapper = () => {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  
  return <BookingPage vehicleId={vehicleId} navigate={(path, params) => {
    if (params?.vehicleId) {
      window.location.href = `/${path}?vehicleId=${params.vehicleId}`;
    } else {
      window.location.href = `/${path}`;
    }
  }} />;
};

const MyBookingsWrapper = () => {
  return <MyBookingsPage navigate={(path, params) => {
    if (params?.vehicleId) {
      window.location.href = `/${path}?vehicleId=${params.vehicleId}`;
    } else {
      window.location.href = `/${path}`;
    }
  }} />;
};

const SavedVehiclesWrapper = () => {
  return <SavedVehiclesPage navigate={(path, params) => {
    if (params?.vehicleId) {
      window.location.href = `/${path}?vehicleId=${params.vehicleId}`;
    } else {
      window.location.href = `/${path}`;
    }
  }} />;
};

// Admin wrapper components
const AdminUsersWrapper = () => {
  return <AdminUsers />;
};

const AdminVehiclesWrapper = () => {
  return <AdminVehicles />;
};

const AdminBookingsWrapper = () => {
  return <AdminBookings />;
};

// Chat wrapper components
const AdminChatWrapper = () => {
  return <AdminChatPage />;
};

const UserChatWrapper = () => {
  return <UserChatPage />;
};

function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}

function InnerApp() {
  const { user, isAuthenticated } = useAuth();

  return (
    <ChatProvider>
      <VehicleProvider>
        <BookingProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/verify-otp" element={<VerifyOtpPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/vehicles" element={<VehicleListingPage />} />
                  <Route path="/vehicle-details" element={<VehicleDetailsWrapper />} />
                  <Route path="/booking" element={<BookingWrapper />} />
                  <Route path="/my-bookings" element={<MyBookingsWrapper />} />
                  <Route path="/saved-vehicles" element={<SavedVehiclesWrapper />} />
                  
                  {/* Chat Routes */}
                  <Route path="/user-chat" element={<UserChatWrapper />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsersWrapper />} />
                  <Route path="/admin/vehicles" element={<AdminVehiclesWrapper />} />
                  <Route path="/admin/bookings" element={<AdminBookingsWrapper />} />
                  <Route path="/admin/chat" element={<AdminChatWrapper />} />
                </Routes>
              </main>
              <Footer />
              
              {/* Chat Components */}
              {isAuthenticated && user?.role !== 'admin' && <ChatbotWidget />}
              <ChatbotWidget />
              
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "16px",
                    color: "#1f2937",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  },
                  success: {
                    style: {
                      background: "rgba(34, 197, 94, 0.1)",
                      borderColor: "rgba(34, 197, 94, 0.3)",
                      color: "#15803d",
                    },
                  },
                  error: {
                    style: {
                      background: "rgba(239, 68, 68, 0.1)",
                      borderColor: "rgba(239, 68, 68, 0.3)",
                      color: "#dc2626",
                    },
                  },
                }}
              />
            </div>
          </Router>
        </BookingProvider>
      </VehicleProvider>
    </ChatProvider>
  );
}

export default App;
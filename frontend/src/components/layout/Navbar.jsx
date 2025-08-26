import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Car, User, LogOut, Shield, Heart, Calendar, MessageCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { unreadCount } = useChat();

  const wishlistCount = user?.savedItems?.length || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setShowUserMenu(false);
    setIsOpen(false);
  };

  const handleNavigation = (page) => {
    navigate(page);
    setIsOpen(false);
    setShowUserMenu(false);
  };

  const navLinks = [
    { name: "Home", page: "/" },
    { name: "Vehicles", page: "/vehicles" },
  ];

  // Add My Bookings and context-aware Chat link to nav links if user is authenticated
  const authenticatedNavLinks = isAuthenticated 
    ? [
        ...navLinks, 
        { name: "My Bookings", page: "/my-bookings" },
        isAdmin ? { name: "Manage Chats", page: "/admin/chat" } : { name: "Chat Support", page: "/user-chat" }
      ]
    : navLinks;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavigation("/")}
            className="flex items-center space-x-2"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg"
            >
              <Car className="h-6 w-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VehicleRent
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {authenticatedNavLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => handleNavigation(link.page)}
                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                  location.pathname === link.page
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {(link.name === "Chat Support" || link.name === "Manage Chats") && (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
                {link.name}
                {location.pathname === link.page && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Wishlist Icon */}
            {isAuthenticated && (
              <button
                onClick={() => handleNavigation("/saved-vehicles")}
                className="relative p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Heart className="h-6 w-6 text-gray-700" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}

            {/* Chat Icon for Quick Access */}
            {/* {isAuthenticated && !isAdmin && (
              <button
                onClick={() => handleNavigation("/chat")}
                className="relative p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <MessageCircle className="h-6 w-6 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )} */}

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 py-2"
                    >
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => handleNavigation("/admin")}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 w-full text-left"
                          >
                            <Shield className="h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </button>
                          <button
                            onClick={() => handleNavigation("/admin/chat")}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 w-full text-left"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>Manage Chats</span>
                            {unreadCount > 0 && (
                              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-auto">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleNavigation("/chat")}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 w-full text-left"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Chat Support</span>
                          {unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-auto">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      )}
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleNavigation("/login")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation("/register")}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors relative"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            {/* Mobile notification indicator */}
            {isAuthenticated && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                className="px-2 pt-2 pb-6 space-y-1 bg-white/95 backdrop-blur-lg rounded-b-2xl shadow-xl border-t border-white/20 mt-2"
              >
                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  {authenticatedNavLinks.map((link) => (
                    <button
                      key={link.page}
                      onClick={() => handleNavigation(link.page)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 flex items-center justify-between ${
                        location.pathname === link.page
                          ? "bg-blue-100 text-blue-700 shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {link.name === "Home" && <Car className="h-5 w-5" />}
                        {link.name === "Vehicles" && <Car className="h-5 w-5" />}
                        {link.name === "My Bookings" && <Calendar className="h-5 w-5" />}
                        {link.name === "Chat Support" && <MessageCircle className="h-5 w-5" />}
                        <span>{link.name}</span>
                      </div>
                      {link.name === "Chat Support" && unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Mobile Actions */}
                {isAuthenticated ? (
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                      </div>
                    </div>

                    {/* Saved Vehicles */}
                    <button
                      onClick={() => handleNavigation("/saved-vehicles")}
                      className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Heart className="h-5 w-5" />
                        <span>Saved Vehicles</span>
                      </div>
                      {wishlistCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {wishlistCount}
                        </span>
                      )}
                    </button>

                    {/* Admin/User Specific Actions */}
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => handleNavigation("/admin")}
                          className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center space-x-3"
                        >
                          <Shield className="h-5 w-5" />
                          <span>Admin Dashboard</span>
                        </button>
                        <button
                          onClick={() => handleNavigation("/admin/chat")}
                          className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <MessageCircle className="h-5 w-5" />
                            <span>Manage Chats</span>
                          </div>
                          {unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleNavigation("/chat")}
                        className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="h-5 w-5" />
                          <span>Chat Support</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center space-x-3"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <button
                      onClick={() => handleNavigation("/login")}
                      className="w-full px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => handleNavigation("/register")}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
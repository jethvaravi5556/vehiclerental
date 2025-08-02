import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "../axiosConfig";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Fetch current user from server
  const fetchUser = useCallback(async (showError = false) => {
    try {
      setLoading(true);
      const response = await axios.get("/api/auth/me", { 
        withCredentials: true,
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      // Only clear user on authentication errors, not network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        setUser(null);
      } else if (showError) {
        console.error("Failed to fetch user:", error.message);
        if (!error.response) {
          toast.error("Network error - please check your connection");
        }
      }
      return null;
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }, []);

  // Login with email and password
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/auth/login", credentials, {
        withCredentials: true
      });

      if (response.data?.user) {
        setUser(response.data.user);
        toast.success(`Welcome back, ${response.data.user.name}!`, {
          icon: "👋",
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
        return { success: true, user: response.data.user };
      }
      
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Login failed. Please try again.";
      
      toast.error(errorMessage, {
        icon: "❌",
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/auth/register", userData, {
        withCredentials: true
      });

      if (response.data?.user) {
        setUser(response.data.user);
        toast.success(`Welcome to our platform, ${response.data.user.name}!`, {
          icon: "🎉",
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
        return { success: true, user: response.data.user };
      }
      
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Registration failed:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Registration failed. Please try again.";
      
      toast.error(errorMessage, {
        icon: "❌",
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setLoading(true);
      await axios.post("/api/auth/logout", {}, {
        withCredentials: true
      });
      
      setUser(null);
      toast.success("Logged out successfully", {
        icon: "👋",
        style: {
          borderRadius: '12px',
          background: '#6B7280',
          color: '#fff',
        },
      });
      
      return { success: true };
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear user locally even if server logout fails
      setUser(null);
      toast.error("Logout completed (with warnings)", {
        icon: "⚠️",
        style: {
          borderRadius: '12px',
          background: '#F59E0B',
          color: '#fff',
        },
      });
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await axios.put("/api/auth/profile", profileData, {
        withCredentials: true
      });

      if (response.data?.user) {
        setUser(response.data.user);
        toast.success("Profile updated successfully!", {
          icon: "✅",
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
        return { success: true, user: response.data.user };
      }
      
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Profile update failed:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to update profile. Please try again.";
      
      toast.error(errorMessage, {
        icon: "❌",
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      const response = await axios.put("/api/auth/change-password", passwordData, {
        withCredentials: true
      });

      if (response.data?.success) {
        toast.success("Password changed successfully!", {
          icon: "🔒",
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
        return { success: true };
      }
      
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Password change failed:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to change password. Please try again.";
      
      toast.error(errorMessage, {
        icon: "❌",
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/auth/forgot-password", { email });

      if (response.data?.success) {
        toast.success("Password reset email sent! Check your inbox.", {
          icon: "📧",
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
        return { success: true };
      }
      
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Forgot password failed:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to send reset email. Please try again.";
      
      toast.error(errorMessage, {
        icon: "❌",
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/auth/reset-password", {
        token,
        password: newPassword
      });

      if (response.data?.success) {
        toast.success("Password reset successfully! You can now login.", {
          icon: "🔒",
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
        return { success: true };
      }
      
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Password reset failed:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to reset password. Please try again.";
      
      toast.error(errorMessage, {
        icon: "❌",
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = useCallback(async () => {
    return await fetchUser(true);
  }, [fetchUser]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  // Get user's full name
  const getUserDisplayName = useCallback(() => {
    if (!user) return "";
    return user.name || user.email?.split("@")[0] || "User";
  }, [user]);

  // Get user avatar or initials
  const getUserAvatar = useCallback(() => {
    if (user?.avatar) return user.avatar;
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  }, [user]);

  // Initialize auth state on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Setup axios interceptor for auth errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && user) {
          // Only logout if we currently have a user
          setUser(null);
          toast.error("Session expired. Please login again.", {
            icon: "⏰",
            style: {
              borderRadius: '12px',
              background: '#F59E0B',
              color: '#fff',
            },
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [user]);

  const value = {
    // State
    user,
    loading,
    initializing,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isUser: user?.role === "user",
    
    // Methods
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    fetchUser,
    refreshUser,
    
    // Utility methods
    hasRole,
    hasAnyRole,
    getUserDisplayName,
    getUserAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
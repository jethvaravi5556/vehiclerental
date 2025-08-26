import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Info,
  MoreVertical,
  User,
  X,
  Users,
  Mail,
  Globe,
  UserCheck,
  Menu,
  Phone,
  Video,
} from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";

const AdminSelectionModal = ({
  isOpen,
  onClose,
  admins,
  onlineUsers,
  onSelectAdmin,
  loading,
  isAdminOnlineById,
}) => {
  if (!isOpen) return null;

  const onlineAdmins = admins.filter((admin) => isAdminOnlineById(admin._id));
  const offlineAdmins = admins.filter((admin) => !isAdminOnlineById(admin._id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                Select Support Agent
              </h2>
              <p className="text-blue-100 text-sm">
                Choose who you'd like to chat with
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-80 sm:max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-6 sm:p-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 text-sm">
                Loading agents...
              </span>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Online Admins */}
              {onlineAdmins.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="font-semibold text-gray-900">
                      Online Now ({onlineAdmins.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {onlineAdmins.map((admin) => (
                      <motion.div
                        key={admin._id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onSelectAdmin(admin)}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                            {admin.name?.charAt(0) || "A"}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {admin.name}
                            </h4>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Online
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {admin.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <UserCheck className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600">
                              Available now
                            </span>
                          </div>
                        </div>
                        <div className="text-blue-600">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offline Admins */}
              {offlineAdmins.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">
                      Offline ({offlineAdmins.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {offlineAdmins.map((admin) => (
                      <motion.div
                        key={admin._id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onSelectAdmin(admin)}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all opacity-75"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                            {admin.name?.charAt(0) || "A"}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {admin.name}
                            </h4>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              Offline
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {admin.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              Will reply when available
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-400">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {admins.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">
                    No Support Agents Available
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Please try again later or contact us via email
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="text-xs sm:text-sm">24/7 Support Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="text-xs sm:text-sm">support@company.com</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const UserChatPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, initializing } = useAuth();
  const {
    messages,
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    fetchMessages,
    fetchConversations,
    isConnected,
    isAdminOnline,
    typingUsers,
    sendTypingIndicator,
    startConversationWithAdmin,
    loading,
    markAsRead,
    admins,
    onlineUsers,
    fetchAdmins,
    isAdminOnlineById,
    getOnlineUsers,
  } = useChat();

  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAdminSelection, setShowAdminSelection] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Handle authentication redirect without clearing user state
  useEffect(() => {
    if (!initializing && !isAuthenticated && !user) {
      navigate("/login");
      return;
    }
  }, [initializing, isAuthenticated, user, navigate]);

  // Load conversations and admins on mount (only when fully authenticated)
  useEffect(() => {
    if (
      !initializing &&
      isAuthenticated &&
      user?.role !== "admin" &&
      !initialLoadDone.current
    ) {
      initialLoadDone.current = true;
      const initializeData = async () => {
        try {
          await fetchConversations();
          await fetchAdmins();
          getOnlineUsers();
        } catch (error) {
          console.error("Error loading initial data:", error);
        }
      };

      // Small delay to ensure everything is ready
      setTimeout(initializeData, 100);
    }
  }, [
    initializing,
    isAuthenticated,
    user?.role,
    fetchConversations,
    fetchAdmins,
    getOnlineUsers,
  ]);

  // Real-time message updates - like WhatsApp
  useEffect(() => {
    if (messages.length > lastMessageCount && lastMessageCount > 0) {
      const newMessage = messages[messages.length - 1];
      if (newMessage && newMessage.senderId !== user?._id) {
        // Auto scroll to new messages
        setTimeout(() => scrollToBottom(true), 100);
      }
    }
    setLastMessageCount(messages.length);
  }, [messages.length, lastMessageCount, user?._id]);

  // Auto scroll to bottom with smooth animation
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  };

  // Auto scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => scrollToBottom(true), 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversation && messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, [activeConversation]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation && initialLoadDone.current) {
      fetchMessages(activeConversation);
      markAsRead(activeConversation);
    }
  }, [activeConversation, fetchMessages, markAsRead]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    const messageToSend = currentMessage;
    setCurrentMessage(""); // Clear input immediately for better UX

    // Auto-resize textarea back to normal
    if (messageInputRef.current) {
      messageInputRef.current.style.height = "40px";
    }

    // Clear typing indicator
    sendTypingIndicator(activeConversation, false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    try {
      const result = await sendMessage(activeConversation, messageToSend);
      if (!result.success) {
        // Restore message if sending failed
        setCurrentMessage(messageToSend);
        console.error("Failed to send message:", result.error);
      } else {
        // Immediate scroll to bottom after sending
        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setCurrentMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);

    // Auto-resize textarea
    if (messageInputRef.current) {
      messageInputRef.current.style.height = "auto";
      const newHeight = Math.min(messageInputRef.current.scrollHeight, 120);
      messageInputRef.current.style.height = newHeight + "px";
    }

    if (activeConversation) {
      sendTypingIndicator(activeConversation, true);

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      const timeout = setTimeout(() => {
        sendTypingIndicator(activeConversation, false);
      }, 2000);

      setTypingTimeout(timeout);
    }
  };

  const startNewChat = async () => {
    // Refresh admins and online users before showing selection
    await fetchAdmins();
    getOnlineUsers();
    setShowAdminSelection(true);
  };

  const handleSelectAdmin = async (admin) => {
    setShowAdminSelection(false);
    setActiveConversation(admin._id);
    setSelectedAdmin(admin);
    setShowWelcome(true);

    setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    // Check if conversation already exists, if not create one
    const existingConversation = conversations.find(
      (conv) => conv.admin._id === admin._id
    );
    if (!existingConversation) {
      // Refresh conversations to include the new one
      setTimeout(() => {
        fetchConversations(true); // Silent update
      }, 500);
    }
  };

  const selectConversation = (conversation) => {
    const admin = conversation.admin;
    setActiveConversation(admin._id);
    setSelectedAdmin(admin);
    setShowAdminInfo(false);
    // Hide sidebar on mobile when selecting conversation
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Use the context function for admin online status
  const isAdminCurrentlyOnline = (adminId) => {
    return isAdminOnlineById(adminId);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Redirect admin users
  if (user?.role === "admin") {
    navigate("/admin/chat");
    return null;
  }

  // Show loading state during initialization
  if (initializing) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex">
      {/* Mobile Menu Button */}
      {/* Mobile Menu / Back Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg"
      >
        {showSidebar ? (
          <button
          onClick={handleGoBack}
          title="Go Back">
          <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } transform transition-transform duration-300 ease-in-out fixed md:relative inset-y-0 left-0 z-40 w-full sm:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col md:translate-x-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors md:hidden"
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors hidden md:block"
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold">Support Chat</h1>
                <p className="text-sm opacity-90">Get instant help</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setShowSidebar(false)}
              className="md:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Status indicators */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              ></div>
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isAdminOnline ? "bg-green-400 animate-pulse" : "bg-orange-400"
                }`}
              ></div>
              <span>
                {isAdminOnline ? "Support Online" : "Support Offline"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs opacity-75">
              <Users className="h-3 w-3" />
              <span>
                {onlineUsers.filter((u) => u.role === "admin").length} online
              </span>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105"
          >
            <MessageCircle className="h-4 w-4" />
            Start New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-6 sm:p-8">
              <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">
                No Conversations
              </h4>
              <p className="text-gray-600 text-sm">
                Start chatting with our support team
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              <AnimatePresence>
                {conversations.map((conversation) => {
                  const isOnline = isAdminCurrentlyOnline(
                    conversation.admin._id
                  );
                  return (
                    <motion.div
                      key={conversation.admin._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      whileHover={{ backgroundColor: "#f9fafb" }}
                      onClick={() => selectConversation(conversation)}
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        activeConversation === conversation.admin._id
                          ? "bg-blue-50 border-r-4 border-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {conversation.admin.name?.charAt(0) || "A"}
                          </div>
                          <div className="absolute -bottom-1 -right-1">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 bg-white rounded-full p-0.5" />
                          </div>
                          {isOnline && (
                            <div className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 truncate flex items-center gap-1">
                              {conversation.admin.name || "Support Agent"}
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Admin
                              </span>
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(
                                conversation.lastMessage?.createdAt
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage?.message ||
                              "No messages yet"}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span
                              className={`text-xs ${
                                isOnline ? "text-green-600" : "text-gray-500"
                              } flex items-center gap-1`}
                            >
                              <div
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                  isOnline ? "bg-green-500" : "bg-gray-400"
                                }`}
                              ></div>
                              {isOnline ? "Online" : "Offline"}
                            </span>
                            {conversation.unreadCount > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 animate-pulse min-w-[20px] text-center"
                              >
                                {conversation.unreadCount > 99
                                  ? "99+"
                                  : conversation.unreadCount}
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {activeConversation && selectedAdmin ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="relative">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedAdmin.name?.charAt(0) || "A"}
                  </div>
                  {isAdminCurrentlyOnline(selectedAdmin._id) && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    {selectedAdmin.name || "Support Agent"}
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                  </h3>
                  <p
                    className={`text-xs sm:text-sm ${
                      isAdminCurrentlyOnline(selectedAdmin._id)
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {isAdminCurrentlyOnline(selectedAdmin._id) ? (
                      <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Online • Support Team
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                        Offline • Will reply soon
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAdminInfo(!showAdminInfo)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Welcome Message */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 p-3 sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Connected to {selectedAdmin.name}!
                      </p>
                      <p className="text-xs text-green-600">
                        Our team is here to help you with any questions.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Admin Info Panel */}
            <AnimatePresence>
              {showAdminInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 border-b p-3 sm:p-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900 truncate">
                        {selectedAdmin.email}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <p
                        className={`${
                          isAdminCurrentlyOnline(selectedAdmin._id)
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        {isAdminCurrentlyOnline(selectedAdmin._id)
                          ? "Online"
                          : "Offline"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-sm">No messages yet</p>
                  <p className="text-xs sm:text-sm">
                    Send a message to start the conversation!
                  </p>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {messages.map((message, index) => {
                      const isOwnMessage =
                        message.senderId === user?._id ||
                        message.sender?._id === user?._id;
                      const showAvatar =
                        index === 0 ||
                        messages[index - 1]?.senderId !== message.senderId;

                      return (
                        <motion.div
                          key={message._id || message.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          } gap-2`}
                        >
                          {!isOwnMessage && showAvatar && (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 relative">
                              {selectedAdmin?.name?.charAt(0) || "A"}
                              {isAdminCurrentlyOnline(selectedAdmin._id) && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                          )}
                          {!isOwnMessage && !showAvatar && (
                            <div className="w-6 sm:w-8" />
                          )}

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[80%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl ${
                              isOwnMessage
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                : "bg-white border border-gray-200 text-gray-900"
                            } shadow-sm ${message.sending ? "opacity-70" : ""}`}
                          >
                            <p className="text-xs sm:text-sm leading-relaxed break-words">
                              {message.message}
                            </p>
                            <div
                              className={`flex items-center justify-between mt-1 gap-2 ${
                                isOwnMessage ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              <span className="text-xs">
                                {formatTime(
                                  message.timestamp || message.createdAt
                                )}
                              </span>
                              {isOwnMessage && (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {Array.from(typingUsers.entries()).map(
                      ([userId, userName]) =>
                        userId === activeConversation && (
                          <motion.div
                            key={userId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2"
                          >
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold relative">
                              {userName?.charAt(0) || "A"}
                              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl px-3 sm:px-4 py-2 shadow-sm">
                              <div className="flex items-center gap-1">
                                <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">
                                  typing...
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={messageInputRef}
                    value={currentMessage}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24 sm:max-h-32 transition-all duration-200 text-sm"
                    rows="1"
                    disabled={isSending}
                    style={{ minHeight: "36px" }}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || !isConnected || isSending}
                  className="rounded-full w-9 h-9 sm:w-10 sm:h-10 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </motion.button>
              </div>

              {!isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-2 text-xs text-red-600"
                >
                  <AlertCircle className="h-3 w-3" />
                  <span>Connection lost. Trying to reconnect...</span>
                </motion.div>
              )}

              {!isAdminCurrentlyOnline(selectedAdmin._id) && isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-2 text-xs text-orange-600"
                >
                  <Clock className="h-3 w-3" />
                  <span>
                    Support is offline. Your message will be delivered when
                    they're back.
                  </span>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6 mx-auto">
                <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Welcome to Support
              </h3>
              <p className="text-gray-600 mb-8 text-sm sm:text-base">
                Start a conversation with our support team to get help with any
                questions.
              </p>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startNewChat}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  Start New Chat
                </motion.button>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isAdminOnline
                          ? "bg-green-500 animate-pulse"
                          : "bg-orange-500"
                      }`}
                    ></div>
                    <span>
                      {isAdminOnline
                        ? `${
                            onlineUsers.filter((u) => u.role === "admin").length
                          } agents online`
                        : "Agents offline"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Admin Selection Modal */}
      <AnimatePresence>
        {showAdminSelection && (
          <AdminSelectionModal
            isOpen={showAdminSelection}
            onClose={() => setShowAdminSelection(false)}
            admins={admins}
            onlineUsers={onlineUsers}
            onSelectAdmin={handleSelectAdmin}
            loading={loading}
            isAdminOnlineById={isAdminOnlineById}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserChatPage;

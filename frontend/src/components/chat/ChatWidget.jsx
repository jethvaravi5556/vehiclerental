import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Users,
  UserCheck,
  Maximize2,
  ArrowDown,
  Mic,
  Paperclip,
  Smile
} from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminSelectionModal = ({ 
  isOpen, 
  onClose, 
  admins, 
  onSelectAdmin, 
  loading,
  isAdminOnlineById
}) => {
  if (!isOpen) return null;

  const onlineAdmins = admins.filter(admin => isAdminOnlineById(admin._id));
  const offlineAdmins = admins.filter(admin => !isAdminOnlineById(admin._id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Select Support</h2>
              <p className="text-green-100 text-xs sm:text-sm">Who would you like to chat with?</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-80 sm:max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-6 sm:p-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600 text-sm">Loading agents...</span>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-3">
              {/* Online Admins */}
              {onlineAdmins.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Online Now ({onlineAdmins.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {onlineAdmins.map((admin) => (
                      <motion.div
                        key={admin._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectAdmin(admin)}
                        className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50 cursor-pointer transition-all active:scale-95"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                            {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{admin.name}</h4>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Online</span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{admin.email}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <UserCheck className="h-2 w-2 sm:h-3 sm:w-3 text-green-600" />
                            <span className="text-xs text-green-600">Available now</span>
                          </div>
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
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Offline ({offlineAdmins.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {offlineAdmins.map((admin) => (
                      <motion.div
                        key={admin._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectAdmin(admin)}
                        className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all active:scale-95 opacity-75"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                            {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{admin.name}</h4>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Offline</span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{admin.email}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-2 w-2 sm:h-3 sm:w-3 text-gray-500" />
                            <span className="text-xs text-gray-500">Will reply soon</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {admins.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">No Support Agents Available</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">Please try again later</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 sm:p-4">
          <p className="text-center text-xs text-gray-500">
            Choose any agent to start your conversation
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const ChatWidget = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, initializing } = useAuth();
  const {
    messages,
    activeConversation,
    setActiveConversation,
    sendMessage,
    fetchMessages,
    fetchConversations,
    isConnected,
    isAdminOnline,
    typingUsers,
    sendTypingIndicator,
    loading,
    markAsRead,
    unreadCount,
    admins,
    fetchAdmins,
    isAdminOnlineById,
    getOnlineUsers
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showAdminSelection, setShowAdminSelection] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Don't show widget for admin users
  if (user?.role === 'admin') {
    return null;
  }

  // Initialize conversations when widget opens and user is authenticated
  useEffect(() => {
    if (isOpen && isAuthenticated && !initializing && user && !initialLoadDone.current) {
      initialLoadDone.current = true;
      const initializeChat = async () => {
        try {
          await fetchConversations();
          await fetchAdmins();
          getOnlineUsers();
        } catch (error) {
          console.error('Error initializing chat:', error);
        }
      };
      initializeChat();
    }
  }, [isOpen, isAuthenticated, initializing, user, fetchConversations, fetchAdmins, getOnlineUsers]);

  // Real-time message updates - like WhatsApp
  useEffect(() => {
    if (messages.length > lastMessageCount && lastMessageCount > 0) {
      const newMessage = messages[messages.length - 1];
      if (newMessage && newMessage.senderId !== user?._id) {
        if (!isOpen) {
          setHasNewMessage(true);
        }
        // Auto scroll to new messages
        setTimeout(() => scrollToBottom(true), 100);
      }
    }
    setLastMessageCount(messages.length);
  }, [messages.length, lastMessageCount, isOpen, user?._id]);

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  // Auto scroll to bottom with smooth animation
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto",
        block: "end"
      });
    }
  };

  // Auto scroll when opening widget or messages change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => scrollToBottom(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Smooth scroll for new messages
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const timer = setTimeout(() => scrollToBottom(true), 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversation && messageInputRef.current && isOpen) {
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, [activeConversation, isOpen]);

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
    setCurrentMessage("");
    
    // Auto-resize textarea back to single line
    if (messageInputRef.current) {
      messageInputRef.current.style.height = '40px';
    }
    
    // Clear typing indicator
    sendTypingIndicator(activeConversation, false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    try {
      const result = await sendMessage(activeConversation, messageToSend);
      if (!result.success) {
        setCurrentMessage(messageToSend);
        console.error('Failed to send message:', result.error);
      } else {
        // Immediate scroll to bottom after sending
        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
      messageInputRef.current.style.height = 'auto';
      const newHeight = Math.min(messageInputRef.current.scrollHeight, 120);
      messageInputRef.current.style.height = newHeight + 'px';
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
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

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

    setTimeout(() => {
      fetchConversations(true);
    }, 500);
  };

  const openWidget = () => {
    setIsOpen(true);
    setHasNewMessage(false);
    if (activeConversation) {
      markAsRead(activeConversation);
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
    // Clear typing indicator when closing
    if (activeConversation && typingTimeout) {
      sendTypingIndicator(activeConversation, false);
      clearTimeout(typingTimeout);
    }
  };

  const handleMaximize = () => {
    setIsOpen(false);
    navigate('/chat');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isAdminCurrentlyOnline = (adminId) => {
    return isAdminOnlineById(adminId);
  };

  return (
    <>
      {/* Chat Widget Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <motion.button
              onClick={openWidget}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full p-3 sm:p-4 shadow-lg hover:shadow-2xl transition-all duration-300 group"
            >
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              
              {/* Notification Badge */}
              {(unreadCount > 0 || hasNewMessage) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center font-bold shadow-lg"
                >
                  {unreadCount > 99 ? '99+' : unreadCount || '!'}
                </motion.div>
              )}
              
              {/* Pulse Effect */}
              {hasNewMessage && (
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 right-4 z-50 bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 transition-all duration-300 overflow-hidden
                       w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]
                       sm:w-80 sm:h-[28rem] sm:bottom-6 sm:right-6
                       md:w-96 md:h-[32rem]
                       lg:w-[400px] lg:h-[600px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-3 sm:p-4 rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {selectedAdmin ? (
                  <>
                    <div className="relative">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                        {selectedAdmin.name?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                      {isAdminCurrentlyOnline(selectedAdmin._id) && (
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base flex items-center gap-1 truncate">
                        {selectedAdmin.name || 'Support Agent'}
                        <Star className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-300 flex-shrink-0" />
                      </h3>
                      <p className="text-xs opacity-90">
                        {isAdminCurrentlyOnline(selectedAdmin._id) ? 'Online now' : 'Offline'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base">Customer Support</h3>
                      <p className="text-xs opacity-90">
                        {isConnected ? 'We\'re here to help!' : 'Connecting...'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMaximize}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Open in full screen"
                >
                  <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeWidget}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </motion.button>
              </div>
            </div>

            {/* Connection Status */}
            <AnimatePresence>
              {!isConnected && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border-b border-red-200 p-2 sm:p-3"
                >
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span>Connection lost. Trying to reconnect...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Welcome Message */}
            <AnimatePresence>
              {showWelcome && selectedAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 p-2 sm:p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-green-800">Connected to {selectedAdmin.name}!</p>
                      <p className="text-xs text-green-600">How can we help you today?</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gray-50 relative"
              style={{ height: 'calc(100% - 140px)' }}
            >
              {!isAuthenticated && !initializing ? (
                <div className="text-center py-6 sm:py-8">
                  <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-4">Please login to start chatting</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-2 rounded-full text-sm transition-colors font-medium"
                  >
                    Login
                  </motion.button>
                </div>
              ) : !activeConversation ? (
                <div className="text-center py-6 sm:py-8">
                  <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-4">Start a conversation with our support team</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startNewChat}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm transition-all duration-200 font-medium shadow-lg"
                  >
                    Start Chat
                  </motion.button>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600 text-sm">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium mb-1">No messages yet</p>
                  <p className="text-xs text-gray-400">Say hello to start the conversation!</p>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {messages.map((message, index) => {
                      const isOwnMessage = message.senderId === user?._id || message.sender?._id === user?._id;
                      const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.senderId !== message.senderId);
                      
                      return (
                        <motion.div
                          key={message._id || message.id || index}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} gap-2`}
                        >
                          {!isOwnMessage && (
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                              {showAvatar && (
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold relative">
                                  {selectedAdmin?.name?.charAt(0)?.toUpperCase() || 'A'}
                                  {isAdminCurrentlyOnline(selectedAdmin?._id) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full border border-white"></div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[80%] sm:max-w-[75%] px-3 sm:px-4 py-2 text-sm leading-relaxed shadow-sm ${
                              isOwnMessage
                                ? 'bg-green-500 text-white rounded-2xl rounded-br-md'
                                : 'bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-md'
                            } ${message.sending ? 'opacity-70' : ''}`}
                          >
                            <p className="break-words text-xs sm:text-sm">{message.message}</p>
                            <div className={`flex items-center justify-between gap-2 mt-1 ${
                              isOwnMessage ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs whitespace-nowrap">
                                {formatTime(message.timestamp || message.createdAt)}
                              </span>
                              {isOwnMessage && (
                                <CheckCircle className="h-3 w-3 flex-shrink-0" />
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {Array.from(typingUsers.entries()).map(([userId, userName]) => (
                      userId === activeConversation && (
                        <motion.div
                          key={userId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold relative">
                            {userName?.charAt(0)?.toUpperCase() || 'A'}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full border border-white animate-pulse"></div>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                              </div>
                              <span className="text-xs text-gray-500">typing...</span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    ))}
                  </AnimatePresence>
                  
                  <div ref={messagesEndRef} />
                </>
              )}

              {/* Scroll to bottom button */}
              <AnimatePresence>
                {showScrollButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            {isAuthenticated && activeConversation && (
              <div className="border-t border-gray-200 bg-white p-2 sm:p-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative min-w-0">
                    <textarea
                      ref={messageInputRef}
                      value={currentMessage}
                      onChange={handleTyping}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm max-h-24 sm:max-h-32 transition-all duration-200 overflow-hidden"
                      rows="1"
                      disabled={isSending}
                      style={{ minHeight: '36px' }}
                    />
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || !isConnected || isSending}
                    className="rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 shadow-lg flex-shrink-0"
                  >
                    {isSending ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </motion.button>
                </div>
                
                <AnimatePresence>
                  {selectedAdmin && !isAdminCurrentlyOnline(selectedAdmin._id) && isConnected && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 mt-2 text-xs text-orange-600"
                    >
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>Support is offline. We'll reply when we're back.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Selection Modal */}
      <AnimatePresence>
        {showAdminSelection && (
          <AdminSelectionModal
            isOpen={showAdminSelection}
            onClose={() => setShowAdminSelection(false)}
            admins={admins}
            onSelectAdmin={handleSelectAdmin}
            loading={loading}
            isAdminOnlineById={isAdminOnlineById}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
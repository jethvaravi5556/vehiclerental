import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowDown
} from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";

const ChatWidget = () => {
  const { user, isAuthenticated } = useAuth();
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
    unreadCount
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Don't show widget for admin users
  if (user?.role === 'admin') {
    return null;
  }

  // Initialize conversations when widget opens
  useEffect(() => {
    if (isOpen && isAuthenticated && !initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchConversations();
    }
  }, [isOpen, isAuthenticated]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversation && messageInputRef.current && isOpen) {
      messageInputRef.current.focus();
    }
  }, [activeConversation, isOpen]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation && initialLoadDone.current) {
      fetchMessages(activeConversation);
      markAsRead(activeConversation);
    }
  }, [activeConversation]);

  // Show notification for new messages when widget is closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId !== user?._id) {
        setHasNewMessage(true);
      }
    }
  }, [messages, isOpen, user?._id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    const messageToSend = currentMessage;
    setCurrentMessage("");
    
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
      // Redirect to login or show login prompt
      window.location.href = '/login';
      return;
    }

    const admin = await startConversationWithAdmin();
    if (admin) {
      setActiveConversation(admin._id);
      setSelectedAdmin(admin);
      setShowWelcome(true);
      
      setTimeout(() => {
        setShowWelcome(false);
      }, 3000);
    }
  };

  const selectConversation = (conversation) => {
    const admin = conversation.admin;
    setActiveConversation(admin._id);
    setSelectedAdmin(admin);
  };

  const openWidget = () => {
    setIsOpen(true);
    setHasNewMessage(false);
    if (activeConversation) {
      markAsRead(activeConversation);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chat Widget Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <button
          onClick={openWidget}
          className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <MessageCircle className="h-6 w-6" />
          
          {/* Notification Badge */}
          {(unreadCount > 0 || hasNewMessage) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount || '!'}
            </motion.div>
          )}
          
          {/* Pulse Effect */}
          {hasNewMessage && (
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
          )}
        </button>
      </motion.div>

      {/* Chat Widget Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 ${
              isMinimized ? 'w-80 h-16' : 'w-80 h-96'
            } transition-all duration-300`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedAdmin ? (
                  <>
                    <div className="relative">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {selectedAdmin.name?.charAt(0) || 'A'}
                      </div>
                      {isAdminOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-1">
                        {selectedAdmin.name || 'Support Agent'}
                        <Star className="h-3 w-3 text-yellow-400" />
                      </h3>
                      <p className="text-xs opacity-90">
                        {isAdminOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-6 w-6" />
                    <div>
                      <h3 className="font-bold text-sm">Customer Support</h3>
                      <p className="text-xs opacity-90">
                        {isConnected ? 'We\'re here to help!' : 'Connecting...'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Connection Status */}
                {!isConnected && (
                  <div className="bg-red-50 border-b border-red-200 p-2">
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Connection lost. Trying to reconnect...</span>
                    </div>
                  </div>
                )}

                {/* Welcome Message */}
                <AnimatePresence>
                  {showWelcome && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-green-800">Connected!</p>
                          <p className="text-xs text-green-600">How can we help you today?</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages Area */}
                <div className="flex-1 h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {!isAuthenticated ? (
                    <div className="text-center py-4">
                      <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">Please login to start chatting</p>
                      <button
                        onClick={() => window.location.href = '/login'}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Login
                      </button>
                    </div>
                  ) : !activeConversation ? (
                    <div className="text-center py-4">
                      <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">Start a conversation with our support team</p>
                      <button
                        onClick={startNewChat}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200"
                      >
                        Start Chat
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      <p className="text-sm">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => {
                        const isOwnMessage = message.senderId === user?._id || message.sender?._id === user?._id;
                        
                        return (
                          <motion.div
                            key={message._id || message.id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                              isOwnMessage
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            } shadow-sm`}>
                              <p className="leading-relaxed">{message.message}</p>
                              <div className={`flex items-center justify-between mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {formatTime(message.timestamp || message.createdAt)}
                                </span>
                                {isOwnMessage && (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      
                      {/* Typing Indicator */}
                      <AnimatePresence>
                        {Array.from(typingUsers.entries()).map(([userId, userName]) => (
                          userId === activeConversation && (
                            <motion.div
                              key={userId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex justify-start"
                            >
                              <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
                                <div className="flex items-center gap-1">
                                  <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                  </div>
                                  <span className="text-xs text-gray-500 ml-1">typing...</span>
                                </div>
                              </div>
                            </motion.div>
                          )
                        ))}
                      </AnimatePresence>
                      
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                {isAuthenticated && activeConversation && (
                  <div className="border-t border-gray-200 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          ref={messageInputRef}
                          value={currentMessage}
                          onChange={handleTyping}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm max-h-20"
                          rows="1"
                          disabled={isSending}
                          style={{ minHeight: '32px' }}
                        />
                      </div>
                      
                      <button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || !isConnected || isSending}
                        className="rounded-full w-8 h-8 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    
                    {!isAdminOnline && isConnected && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                        <Clock className="h-3 w-3" />
                        <span>Support is offline. We'll reply when we're back.</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
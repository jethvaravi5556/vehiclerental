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
  Phone,
  Video,
  Info,
  MoreVertical,
  Settings,
  Minimize2,
  User,
  X,
  Maximize2
} from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";

const UserChatPage = () => {
  const navigate = useNavigate();
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
    markAsRead
  } = useChat();

  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin' && !initialLoadDone.current) {
      initialLoadDone.current = true;
      setTimeout(() => {
        fetchConversations();
      }, 100);
    }
  }, [isAuthenticated, user?.role]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversation && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [activeConversation]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation && initialLoadDone.current) {
      fetchMessages(activeConversation);
      markAsRead(activeConversation);
    }
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    const messageToSend = currentMessage;
    setCurrentMessage(""); // Clear input immediately for better UX
    
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
    setShowAdminInfo(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Redirect admin users
  if (user?.role === 'admin') {
    navigate('/admin/chat');
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${isMinimized ? 'w-0' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-lg font-bold">Support Chat</h1>
                  <p className="text-sm opacity-90">Get instant help</p>
                </div>
              </div>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isAdminOnline ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                <span>{isAdminOnline ? 'Support Online' : 'Support Offline'}</span>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={startNewChat}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Start New Chat
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-900 mb-2">No Conversations</h4>
                <p className="text-gray-600 text-sm">Start chatting with our support team</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.admin._id}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 cursor-pointer transition-colors ${
                      activeConversation === conversation.admin._id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {conversation.admin.name?.charAt(0) || 'A'}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          <Star className="h-4 w-4 text-yellow-500 bg-white rounded-full p-0.5" />
                        </div>
                        {isAdminOnline && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 truncate flex items-center gap-1">
                            {conversation.admin.name || 'Support Agent'}
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Admin</span>
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(conversation.lastMessage?.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage?.message || 'No messages yet'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {isAdminOnline ? 'Online' : 'Offline'}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {activeConversation && selectedAdmin ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedAdmin.name?.charAt(0) || 'A'}
                    </div>
                    {isAdminOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {selectedAdmin.name || 'Support Agent'}
                      <Star className="h-4 w-4 text-yellow-400" />
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isAdminOnline ? 'Online • Support Team' : 'Offline • Will reply soon'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdminInfo(!showAdminInfo)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4" />
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
                    className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-800">Connected to Support!</p>
                        <p className="text-xs text-green-600">Our team is here to help you with any questions.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {showAdminInfo && (
                <div className="bg-gray-50 border-b p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{selectedAdmin.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <p className="text-gray-900">
                        {isAdminOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isOwnMessage = message.senderId === user?._id || message.sender?._id === user?._id;
                      const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;
                      
                      return (
                        <motion.div
                          key={message._id || message.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} gap-2`}
                        >
                          {!isOwnMessage && showAvatar && (
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {selectedAdmin?.name?.charAt(0) || 'A'}
                            </div>
                          )}
                          {!isOwnMessage && !showAvatar && <div className="w-8" />}
                          
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          } shadow-sm`}>
                            <p className="text-sm leading-relaxed">{message.message}</p>
                            <div className={`flex items-center justify-between mt-1 gap-2 ${
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
                            className="flex items-center gap-2"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {userName?.charAt(0) || 'A'}
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
                              <div className="flex items-center gap-1">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">
                                  typing...
                                </span>
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
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={messageInputRef}
                      value={currentMessage}
                      onChange={handleTyping}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24"
                      rows="1"
                      disabled={isSending}
                      style={{ minHeight: '40px' }}
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || !isConnected || isSending}
                    className="rounded-full w-10 h-10 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200"
                  >
                    {isSending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {!isConnected && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Connection lost. Trying to reconnect...</span>
                  </div>
                )}
                
                {!isAdminOnline && isConnected && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-orange-600">
                    <Clock className="h-3 w-3" />
                    <span>Support is offline. Your message will be delivered when they're back.</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* No Conversation Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <MessageCircle className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Support</h3>
                <p className="text-gray-600 mb-8">Start a conversation with our support team to get help with any questions.</p>
                <button
                  onClick={startNewChat}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserChatPage;
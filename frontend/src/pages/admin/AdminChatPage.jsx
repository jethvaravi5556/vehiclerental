import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Users,
  Clock,
  CheckCircle,
  Search,
  Filter,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Phone,
  Video,
  Info,
  AlertCircle,
  CheckCheck,
  Circle,
  UserCircle,
  Settings,
  X,
  Minimize2,
  Maximize2,
  ArrowLeft
} from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";

const AdminChatPage = () => {
  const { user } = useAuth();
  const {
    messages,
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    fetchMessages,
    fetchConversations,
    isConnected,
    onlineUsers,
    typingUsers,
    sendTypingIndicator,
    getOnlineUsers,
    loading,
    markAsRead
  } = useChat();

  const [currentMessage, setCurrentMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Load data on component mount
  useEffect(() => {
    if (user?.role === 'admin' && !initialLoadDone.current) {
      console.log('Admin chat page: Loading initial data');
      initialLoadDone.current = true;
      
      setTimeout(() => {
        fetchConversations();
        getOnlineUsers();
      }, 100);
    }
  }, [user?.role]);

  // Auto scroll to bottom when messages change
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
      console.log('Admin: Fetching messages for conversation:', activeConversation);
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
    setCurrentMessage(""); // Clear input immediately
    
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

  const selectConversation = (conversationData) => {
    console.log('Admin selecting conversation with user:', conversationData.user._id);
    setActiveConversation(conversationData.user._id);
    setSelectedUser(conversationData.user);
    setShowUserInfo(false);
    setShowConversationList(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId);
  };

  const getUnreadCount = () => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${showConversationList ? 'w-80' : 'w-0 lg:w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-lg font-bold">Chat Management</h1>
                  <p className="text-sm opacity-90">Customer support</p>
                </div>
              </div>
              <button
                onClick={() => setShowConversationList(false)}
                className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{isConnected ? 'Connected' : 'Offline'}</span>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 rounded-full bg-blue-400 mx-auto mb-1"></div>
                <span>{onlineUsers.length} online</span>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mx-auto mb-1"></div>
                <span>{getUnreadCount()} unread</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center p-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? 'No conversations found' : 'No active conversations'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.user._id}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 cursor-pointer transition-colors ${
                      activeConversation === conversation.user._id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {conversation.user.name?.charAt(0) || 'U'}
                        </div>
                        {isUserOnline(conversation.user._id) && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 truncate">
                            {conversation.user.name || 'Unknown User'}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessage?.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage?.message || 'No messages yet'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(conversation.lastMessage?.createdAt)}
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
          {activeConversation && selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowConversationList(true)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedUser.name?.charAt(0) || 'U'}
                    </div>
                    {isUserOnline(selectedUser._id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">{selectedUser.name || 'Unknown User'}</h3>
                    <p className="text-sm text-gray-600">
                      {isUserOnline(selectedUser._id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUserInfo(!showUserInfo)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {showUserInfo && (
                <div className="bg-gray-50 border-b p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <p className="text-gray-900">
                        {isUserOnline(selectedUser._id) ? 'Online' : 'Offline'}
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
                    <p>No messages yet. Start the conversation!</p>
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
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {selectedUser?.name?.charAt(0) || 'U'}
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
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {userName?.charAt(0) || 'U'}
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
              </div>
            </>
          ) : (
            /* No Conversation Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <MessageCircle className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Select a Conversation</h3>
                <p className="text-gray-600 mb-8">Choose a conversation from the sidebar to start chatting with customers.</p>
                <button
                  onClick={() => setShowConversationList(true)}
                  className="lg:hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <Users className="h-4 w-4" />
                  View Conversations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatPage;
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from '../axiosConfig';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated, initializing } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(() => {
    const saved = sessionStorage.getItem('activeConversation');
    return saved || null;
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const socketRef = useRef(null);
  const initializationRef = useRef(false);
  const lastMessageRef = useRef(null);
  const conversationUpdateTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Stable fetch functions
  const fetchConversations = useCallback(async (silent = false) => {
    if (!user || (loading && !silent)) return;
    
    console.log('Fetching conversations for user:', user.role);
    if (!silent) setLoading(true);
    
    try {
      const endpoint = user.role === 'admin' 
        ? '/api/chats/admin/conversations' 
        : '/api/chats/user/conversations';
      
      const response = await axios.get(endpoint);
      console.log('Conversations fetched:', response.data);
      
      const newConversations = response.data || [];
      
      setConversations(newConversations);
      
      // Auto-update unread count
      const totalUnread = newConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load conversations');
      }
      setConversations([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.role, user?._id, loading]);

  const fetchMessages = useCallback(async (userId, page = 1, limit = 50) => {
    if (!userId) return { messages: [], hasMore: false };
    
    console.log('Fetching messages for conversation with user:', userId);
    try {
      const response = await axios.get(`/api/chats/conversation/${userId}?page=${page}&limit=${limit}`);
      console.log('Messages fetched:', response.data);
      const fetchedMessages = response.data.messages || [];
      
      // Sort messages by timestamp to ensure proper order
      const sortedMessages = fetchedMessages.sort((a, b) => 
        new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp)
      );
      
      setMessages(sortedMessages);
      
      return { messages: sortedMessages, hasMore: response.data.hasMore || false };
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load messages');
      }
      setMessages([]);
      return { messages: [], hasMore: false };
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/chats/unread-count');
      const count = response.data.unreadCount || 0;
      console.log('Unread count:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }, [user?._id]);

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await axios.get('/api/chats/admins');
      console.log('Admins fetched:', response.data);
      setAdmins(response.data || []);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching admins:', error);
      setAdmins([]);
      return [];
    }
  }, []);

  // Add message with real-time updates
  const addMessage = useCallback((newMessage) => {
    setMessages(prevMessages => {
      // Check for duplicates
      const isDuplicate = prevMessages.some(msg => {
        return (
          msg._id === newMessage._id ||
          msg.id === newMessage.id ||
          (msg.message === newMessage.message && 
           msg.senderId === newMessage.senderId &&
           Math.abs(new Date(msg.createdAt || msg.timestamp) - new Date(newMessage.createdAt || newMessage.timestamp)) < 2000)
        );
      });
      
      if (isDuplicate) {
        console.log('Duplicate message prevented:', newMessage);
        return prevMessages;
      }
      
      // Add new message and sort
      const updatedMessages = [...prevMessages, newMessage].sort((a, b) => 
        new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp)
      );
      
      console.log('Message added to local state:', newMessage);
      
      // Update conversations list immediately for real-time feel
      setTimeout(() => {
        fetchConversations(true);
      }, 100);
      
      return updatedMessages;
    });
  }, [fetchConversations]);

  // Initialize socket connection
  useEffect(() => {
    if (!initializing && isAuthenticated && user && !initializationRef.current) {
      console.log('Initializing chat for user:', user.name, user.role);
      initializationRef.current = true;
      
      // Delay initialization to ensure auth is fully loaded
      const timer = setTimeout(() => {
        initializeSocket();
        fetchUnreadCount();
        fetchConversations();
        if (user.role !== 'admin') {
          fetchAdmins();
        }
        // Restore messages for saved active conversation
        if (activeConversation) {
          fetchMessages(activeConversation);
        }
      }, 500);

      return () => clearTimeout(timer);
    }

    return () => {
      if (!isAuthenticated || !user) {
        cleanup();
      }
    };
  }, [initializing, isAuthenticated, user?._id]);

  const cleanup = () => {
    if (socketRef.current) {
      console.log('Cleaning up socket connection');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
    
    if (conversationUpdateTimeoutRef.current) {
      clearTimeout(conversationUpdateTimeoutRef.current);
      conversationUpdateTimeoutRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    initializationRef.current = false;
    lastMessageRef.current = null;
    setMessages([]);
    setConversations([]);
    setActiveConversation(null);
    setUnreadCount(0);
    setOnlineUsers([]);
    setIsAdminOnline(false);
    setTypingUsers(new Map());
    setAdmins([]);
  };

  // Persist active conversation across refreshes
  useEffect(() => {
    if (activeConversation) {
      sessionStorage.setItem('activeConversation', activeConversation);
    } else {
      sessionStorage.removeItem('activeConversation');
    }
  }, [activeConversation]);

  const initializeSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('Connecting to socket server:', serverUrl);

    const newSocket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 10,
      timeout: 20000,
      forceNew: true
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setIsConnected(true);
      
      newSocket.emit('join', {
        userId: user._id,
        role: user.role,
        isAdmin: user.role === 'admin',
        name: user.name
      });

      // Request initial data after connection
      setTimeout(() => {
        newSocket.emit('get-online-users');
      }, 1000);

      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);

      // Auto-reconnect after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isConnected && user) {
          console.log('Attempting to reconnect...');
          initializeSocket();
        }
      }, 3000);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      
      // Re-join the room after reconnection
      newSocket.emit('join', {
        userId: user._id,
        role: user.role,
        isAdmin: user.role === 'admin',
        name: user.name
      });
      
      newSocket.emit('get-online-users');
      
      // Refresh data after reconnection
      fetchConversations(true);
      if (activeConversation) {
        fetchMessages(activeConversation);
      }
    });

    // Real-time message handling
    newSocket.on('new-message', (messageData) => {
      console.log('New message received via socket:', messageData);
      
      const normalizedMessage = {
        _id: messageData._id || messageData.id || Date.now().toString(),
        sender: messageData.sender || { 
          _id: messageData.senderId, 
          name: messageData.senderName,
          role: messageData.senderRole 
        },
        receiver: messageData.receiver || { _id: messageData.receiverId },
        message: messageData.message,
        createdAt: messageData.createdAt || messageData.timestamp || new Date().toISOString(),
        timestamp: messageData.timestamp || messageData.createdAt || new Date().toISOString(),
        senderId: messageData.senderId || messageData.sender?._id,
        receiverId: messageData.receiverId || messageData.receiver?._id
      };

      // Add to current conversation if it matches
      if (activeConversation && 
          (normalizedMessage.senderId === activeConversation || 
           normalizedMessage.receiverId === activeConversation ||
           normalizedMessage.sender._id === activeConversation ||
           normalizedMessage.receiver._id === activeConversation)) {
        addMessage(normalizedMessage);
      }

      // Always refresh conversations to update sidebar/unread badges in real-time
      fetchConversations(true);

      // Update unread count and show notification for messages not from current user
      if (normalizedMessage.senderId !== user._id && normalizedMessage.sender._id !== user._id) {
        if (!activeConversation || 
            (normalizedMessage.senderId !== activeConversation && 
             normalizedMessage.sender._id !== activeConversation)) {
          setUnreadCount(prev => prev + 1);
        }

        const senderName = normalizedMessage.sender?.name || messageData.senderName;
        if (senderName) {
          toast.success(`New message from ${senderName}`, {
            icon: '💬',
            duration: 3000,
          });
        }
      }
    });

    newSocket.on('private-message', (messageData) => {
      console.log('Private message received via socket:', messageData);
      
      const normalizedMessage = {
        _id: messageData.id || messageData._id || Date.now().toString(),
        sender: { 
          _id: messageData.senderId, 
          name: messageData.senderName,
          role: messageData.senderRole 
        },
        receiver: { _id: messageData.receiverId },
        message: messageData.message,
        createdAt: messageData.timestamp || new Date().toISOString(),
        timestamp: messageData.timestamp || new Date().toISOString(),
        senderId: messageData.senderId,
        receiverId: messageData.receiverId
      };

      // Add message to current conversation
      if (activeConversation && 
          (normalizedMessage.senderId === activeConversation || 
           normalizedMessage.receiverId === activeConversation)) {
        addMessage(normalizedMessage);
      }

      // Update conversations list even if message is for another conversation
      fetchConversations(true);
    });

    // Typing indicators
    newSocket.on('typing', ({ senderId, isTyping, senderName }) => {
      if (senderId !== user._id) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (isTyping) {
            newMap.set(senderId, senderName);
            setTimeout(() => {
              setTypingUsers(current => {
                const updated = new Map(current);
                updated.delete(senderId);
                return updated;
              });
            }, 5000);
          } else {
            newMap.delete(senderId);
          }
          return newMap;
        });
      }
    });

    // Online status events
    newSocket.on('online-users-list', (usersList) => {
      console.log('Online users list received:', usersList);
      
      const validUsers = Array.isArray(usersList) ? usersList : [];
      const normalizedUsers = validUsers.map(user => ({
        userId: user.userId || user.id || user._id,
        userName: user.userName || user.name,
        role: user.role || 'user',
        isOnline: user.isOnline !== undefined ? user.isOnline : true,
        socketId: user.socketId
      }));
      
      setOnlineUsers(normalizedUsers);
      
      const onlineAdminsCount = normalizedUsers.filter(u => u.role === 'admin' && u.isOnline).length;
      setIsAdminOnline(onlineAdminsCount > 0);
    });

    newSocket.on('user-online', (userData) => {
      console.log('User came online:', userData);
      const normalizedUser = {
        userId: userData.userId || userData.id || userData._id,
        userName: userData.userName || userData.name,
        role: userData.role || 'user',
        isOnline: true,
        socketId: userData.socketId
      };
      
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== normalizedUser.userId);
        const updated = [...filtered, normalizedUser];
        
        const onlineAdminsCount = updated.filter(u => u.role === 'admin' && u.isOnline).length;
        setIsAdminOnline(onlineAdminsCount > 0);
        
        return updated;
      });
    });

    newSocket.on('user-offline', (userData) => {
      console.log('User went offline:', userData);
      const userId = userData.userId || userData.id || userData._id;
      
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== userId);
        
        const remainingOnlineAdmins = filtered.filter(u => u.role === 'admin' && u.isOnline).length;
        setIsAdminOnline(remainingOnlineAdmins > 0);
        
        return filtered;
      });
    });

    newSocket.on('admin-status', ({ isOnline, adminCount, onlineAdmins }) => {
      console.log('Admin status update:', { isOnline, adminCount, onlineAdmins });
      const adminOnlineStatus = isOnline || (adminCount && adminCount > 0) || (onlineAdmins && onlineAdmins > 0);
      setIsAdminOnline(adminOnlineStatus);
    });

    newSocket.on('connection-status', ({ isConnected: connected, onlineAdmins, adminCount }) => {
      console.log('Connection status update:', { connected, onlineAdmins, adminCount });
      setIsConnected(connected);
      const adminOnlineStatus = (onlineAdmins && onlineAdmins > 0) || (adminCount && adminCount > 0);
      setIsAdminOnline(adminOnlineStatus);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Chat connection error. Please try again.');
    });

    // Message sent confirmation
    newSocket.on('message-sent', (data) => {
      console.log('Message sent confirmation:', data);
    });
  };

  // Enhanced send message function with optimistic updates
  const sendMessage = async (receiverId, message) => {
    if (!receiverId || !message.trim() || !isConnected) {
      console.warn('Cannot send message:', { receiverId, message: !!message.trim(), isConnected });
      toast.error('Cannot send message. Please check your connection.');
      return { success: false, error: 'Invalid message or not connected' };
    }

    const trimmedMessage = message.trim();
    console.log('Sending message to:', receiverId, 'Message:', trimmedMessage);

    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      _id: 'temp_' + Date.now(),
      sender: { 
        _id: user._id, 
        name: user.name,
        role: user.role 
      },
      receiver: { _id: receiverId },
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      senderId: user._id,
      receiverId: receiverId,
      sending: true
    };

    // Add optimistic message immediately
    addMessage(optimisticMessage);

    try {
      const response = await axios.post('/api/chats/send', {
        receiverId,
        message: trimmedMessage,
        messageType: 'text'
      });

      const messageData = response.data;
      console.log('Message sent successfully:', messageData);

      // Remove optimistic message and add real message
      setMessages(prevMessages => {
        const filtered = prevMessages.filter(msg => msg._id !== optimisticMessage._id);
        
        const realMessage = {
          _id: messageData._id || Date.now().toString(),
          sender: messageData.sender || { 
            _id: user._id, 
            name: user.name,
            role: user.role 
          },
          receiver: messageData.receiver || { _id: receiverId },
          message: trimmedMessage,
          createdAt: messageData.createdAt || new Date().toISOString(),
          timestamp: messageData.timestamp || new Date().toISOString(),
          senderId: user._id,
          receiverId: receiverId
        };

        const updatedMessages = [...filtered, realMessage].sort((a, b) => 
          new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp)
        );

        return updatedMessages;
      });

      // Emit socket event for real-time update to other users
      if (socket && isConnected) {
        socket.emit('private-message', {
          senderId: user._id,
          receiverId,
          message: trimmedMessage,
          senderName: user.name,
          senderRole: user.role,
          isAdmin: user.role === 'admin',
          timestamp: new Date().toISOString(),
          _id: messageData._id
        });
      }

      return { success: true, message: messageData };
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== optimisticMessage._id)
      );
      
      const errorMsg = error.response?.data?.message || 'Failed to send message';
      toast.error(errorMsg);
      return { success: false, error };
    }
  };

  // Send typing indicator
  const sendTypingIndicator = (receiverId, isTyping) => {
    if (socket && receiverId && isConnected) {
      socket.emit('typing', {
        receiverId,
        isTyping,
        senderName: user.name,
        senderId: user._id
      });
    }
  };

  // Mark messages as read
  const markAsRead = useCallback(async (senderId) => {
    if (!senderId) return;

    try {
      await axios.put(`/api/chats/mark-read/${senderId}`);
      console.log('Messages marked as read for sender:', senderId);
      
      fetchUnreadCount();
      fetchConversations(true);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [fetchUnreadCount, fetchConversations]);

  // Start conversation with admin
  const startConversationWithAdmin = async (adminId = null) => {
    if (user.role === 'admin') return null;

    try {
      if (adminId) {
        const allAdmins = await fetchAdmins();
        const selectedAdmin = allAdmins.find(admin => admin._id === adminId);
        
        if (selectedAdmin) {
          console.log('Selected specific admin for conversation:', selectedAdmin);
          return selectedAdmin;
        } else {
          toast.error('Selected admin is not available');
          return null;
        }
      }

      const availableAdmins = await fetchAdmins();
      console.log('Available admins for conversation:', availableAdmins);
      
      if (availableAdmins.length > 0) {
        return availableAdmins[0];
      }
      
      toast.error('No admin available at the moment');
      return null;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
      return null;
    }
  };

  // Get online users
  const getOnlineUsers = () => {
    if (socket && isConnected) {
      console.log('Requesting online users list');
      socket.emit('get-online-users');
    }
  };

  // Check admin status
  const checkAdminStatus = () => {
    if (socket && user?.role !== 'admin' && isConnected) {
      console.log('Checking admin status');
      socket.emit('check-admin-status');
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`/api/chats/${messageId}`);
      
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      fetchConversations(true);
      
      toast.success('Message deleted');
      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      return { success: false, error };
    }
  };

  // Clear active conversation
  const clearActiveConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    lastMessageRef.current = null;
  };

  // Get admin by ID
  const getAdminById = useCallback((adminId) => {
    return admins.find(admin => admin._id === adminId) || null;
  }, [admins]);

  // Check if admin is online
  const isAdminOnlineById = useCallback((adminId) => {
    if (!adminId) return false;
    
    const adminIdStr = adminId.toString();
    
    return onlineUsers.some(user => {
      const userIdStr = (user.userId || user.id || user._id || '').toString();
      const roleMatch = user.role === 'admin';
      const onlineStatus = user.isOnline === true;
      const idMatch = userIdStr === adminIdStr;
      
      return idMatch && roleMatch && onlineStatus;
    });
  }, [onlineUsers]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    console.log('Force refreshing all data...');
    setLoading(true);
    
    try {
      await Promise.all([
        fetchConversations(),
        fetchAdmins(),
        fetchUnreadCount()
      ]);
      
      if (activeConversation) {
        await fetchMessages(activeConversation);
      }
      
      if (socketRef.current && isConnected) {
        socketRef.current.emit('get-online-users');
      }
      
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error during force refresh:', error);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchConversations, fetchAdmins, fetchUnreadCount, fetchMessages, activeConversation, isConnected]);

  const value = {
    // State
    socket,
    isConnected,
    messages,
    conversations,
    activeConversation,
    unreadCount,
    onlineUsers,
    isAdminOnline,
    typingUsers,
    loading,
    admins,

    // Actions
    setActiveConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    fetchUnreadCount,
    startConversationWithAdmin,
    getOnlineUsers,
    checkAdminStatus,
    deleteMessage,
    clearActiveConversation,
    fetchAdmins,
    addMessage,
    getAdminById,
    isAdminOnlineById,
    forceRefresh
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
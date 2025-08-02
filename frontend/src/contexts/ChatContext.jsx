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
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const socketRef = useRef(null);
  const initializationRef = useRef(false);
  const lastMessageRef = useRef(null);

  // Stable fetch functions
  const fetchConversations = useCallback(async () => {
    if (!user || loading) return;
    
    console.log('Fetching conversations for user:', user.role);
    setLoading(true);
    try {
      const endpoint = user.role === 'admin' 
        ? '/api/chats/admin/conversations' 
        : '/api/chats/user/conversations';
      
      const response = await axios.get(endpoint);
      console.log('Conversations fetched:', response.data);
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load conversations');
      }
      setConversations([]);
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error('Error fetching admins:', error);
      setAdmins([]);
    }
  }, []);

  // Add message helper function to prevent duplicates
  const addMessage = useCallback((newMessage) => {
    setMessages(prevMessages => {
      // Check for duplicates based on multiple criteria
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
      
      console.log('Message added:', newMessage);
      return updatedMessages;
    });
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user && !initializationRef.current) {
      console.log('Initializing chat for user:', user.name, user.role);
      initializationRef.current = true;
      
      initializeSocket();
      fetchUnreadCount();
      fetchConversations();
      if (user.role !== 'admin') {
        fetchAdmins();
      }
    }

    return () => {
      if (!isAuthenticated || !user) {
        cleanup();
      }
    };
  }, [isAuthenticated, user?._id]);

  const cleanup = () => {
    if (socketRef.current) {
      console.log('Cleaning up socket connection');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
    initializationRef.current = false;
    setMessages([]);
    setConversations([]);
    setActiveConversation(null);
    setUnreadCount(0);
    setOnlineUsers([]);
    setIsAdminOnline(false);
    setTypingUsers(new Map());
    setAdmins([]);
  };

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
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      // Refresh conversations on reconnect
      setTimeout(() => fetchConversations(), 1000);
    });

    // Enhanced message handling
    newSocket.on('new-message', (messageData) => {
      console.log('New message received:', messageData);
      
      const normalizedMessage = {
        _id: messageData._id || messageData.id || Date.now().toString(),
        sender: messageData.sender || { 
          _id: messageData.senderId, 
          name: messageData.senderName,
          role: messageData.senderRole 
        },
        receiver: messageData.receiver || { _id: messageData.receiverId },
        message: messageData.message,
        createdAt: messageData.createdAt || messageData.timestamp,
        timestamp: messageData.timestamp || messageData.createdAt,
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

      // Update unread count and show notification
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

      // Refresh conversations after a short delay
      setTimeout(() => {
        fetchConversations();
      }, 500);
    });

    newSocket.on('private-message', (messageData) => {
      console.log('Private message received:', messageData);
      
      const normalizedMessage = {
        _id: messageData.id || Date.now().toString(),
        sender: { 
          _id: messageData.senderId, 
          name: messageData.senderName,
          role: messageData.senderRole 
        },
        receiver: { _id: messageData.receiverId },
        message: messageData.message,
        createdAt: messageData.timestamp,
        timestamp: messageData.timestamp,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId
      };

      if (activeConversation && 
          (normalizedMessage.senderId === activeConversation || 
           normalizedMessage.receiverId === user._id)) {
        addMessage(normalizedMessage);
      }
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
    newSocket.on('admin-status', ({ isOnline, onlineAdmins }) => {
      console.log('Admin status update:', { isOnline, onlineAdmins });
      setIsAdminOnline(isOnline || onlineAdmins > 0);
    });

    newSocket.on('online-users-list', (usersList) => {
      console.log('Online users list:', usersList);
      setOnlineUsers(Array.isArray(usersList) ? usersList : []);
    });

    newSocket.on('user-online', ({ userId, userName, role }) => {
      console.log('User came online:', { userId, userName, role });
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== userId);
        return [...filtered, { userId, userName, role, isOnline: true }];
      });
      
      if (role === 'admin') {
        setIsAdminOnline(true);
      }
    });

    newSocket.on('user-offline', ({ userId, role }) => {
      console.log('User went offline:', { userId, role });
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== userId);
        if (role === 'admin') {
          const onlineAdmins = filtered.filter(u => u.role === 'admin').length;
          setIsAdminOnline(onlineAdmins > 0);
        }
        return filtered;
      });
    });

    newSocket.on('connection-status', ({ isConnected: connected, onlineAdmins }) => {
      console.log('Connection status:', { connected, onlineAdmins });
      setIsConnected(connected);
      setIsAdminOnline(onlineAdmins > 0);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Chat connection error. Please refresh the page.');
    });
  };

  // Enhanced send message function
  const sendMessage = async (receiverId, message) => {
    if (!receiverId || !message.trim() || !isConnected) {
      console.warn('Cannot send message:', { receiverId, message: !!message.trim(), isConnected });
      return { success: false, error: 'Invalid message or not connected' };
    }

    const trimmedMessage = message.trim();
    console.log('Sending message to:', receiverId, 'Message:', trimmedMessage);

    try {
      const response = await axios.post('/api/chats/send', {
        receiverId,
        message: trimmedMessage,
        messageType: 'text'
      });

      const messageData = response.data;
      console.log('Message sent successfully:', messageData);

      // Create normalized message object
      const normalizedMessage = {
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

      // Add to local messages immediately
      addMessage(normalizedMessage);

      // Emit socket event for real-time update
      if (socket) {
        socket.emit('private-message', {
          senderId: user._id,
          receiverId,
          message: trimmedMessage,
          senderName: user.name,
          senderRole: user.role,
          isAdmin: user.role === 'admin',
          timestamp: new Date().toISOString()
        });
      }

      // Update conversations list
      setTimeout(() => {
        fetchConversations();
      }, 300);

      return { success: true, message: normalizedMessage };
    } catch (error) {
      console.error('Error sending message:', error);
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
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [fetchUnreadCount]);

  // Start conversation with admin
  const startConversationWithAdmin = async () => {
    if (user.role === 'admin') return null;

    try {
      const response = await axios.get('/api/chats/admins');
      const availableAdmins = response.data || [];
      console.log('Available admins:', availableAdmins);
      
      if (availableAdmins.length > 0) {
        const onlineAdmin = availableAdmins.find(admin => 
          onlineUsers.some(u => u.userId === admin._id)
        );
        const selectedAdmin = onlineAdmin || availableAdmins[0];
        
        console.log('Selected admin for conversation:', selectedAdmin);
        return selectedAdmin;
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
    if (socket && user?.role === 'admin' && isConnected) {
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
  };

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
    addMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
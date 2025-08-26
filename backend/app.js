import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import passport from "./config/passport.js";
import sessionMiddleware from "./middlewares/session.js";
import http from "http";
import { Server } from "socket.io";

// Routes
import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enhanced Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store online users with consistent structure
const onlineUsers = new Map(); // userId -> { socketId, userId, userName, role, isOnline, joinedAt }
const socketToUser = new Map(); // socketId -> { userId, userName, role }

// Helper function to get all online users as array
const getOnlineUsersArray = () => {
  return Array.from(onlineUsers.values()).map(user => ({
    userId: user.userId,
    userName: user.userName,
    role: user.role,
    isOnline: true,
    socketId: user.socketId,
    joinedAt: user.joinedAt
  }));
};

// Helper function to get online admins count
const getOnlineAdminsCount = () => {
  return Array.from(onlineUsers.values()).filter(user => user.role === 'admin').length;
};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // User joins with their ID and role
  socket.on("join", ({ userId, role, isAdmin, name }) => {
    console.log(`User joining: ${userId} (${role}) - ${name}`);
    
    const userInfo = {
      socketId: socket.id,
      userId: userId,
      userName: name || 'Unknown',
      role: role || 'user',
      isOnline: true,
      joinedAt: new Date()
    };
    
    // Store user info
    onlineUsers.set(userId, userInfo);
    socketToUser.set(socket.id, {
      userId: userId,
      userName: name || 'Unknown',
      role: role || 'user'
    });
    
    // Set socket properties
    socket.userId = userId;
    socket.userRole = role;
    socket.userName = name;
    socket.isAdmin = isAdmin || role === 'admin';
    
    console.log(`User ${name} (${role}) joined. Total online:`, onlineUsers.size);
    
    // Send current online users list to the newly joined user
    socket.emit("online-users-list", getOnlineUsersArray());
    
    // Send connection status to user
    socket.emit("connection-status", { 
      isConnected: true, 
      onlineAdmins: getOnlineAdminsCount(),
      totalOnline: onlineUsers.size
    });
    
    // Broadcast to all clients that a new user is online
    socket.broadcast.emit("user-online", userInfo);
    
    // Send updated online users list to all clients
    io.emit("online-users-list", getOnlineUsersArray());
    
    console.log(`Online stats - Total: ${onlineUsers.size}, Admins: ${getOnlineAdminsCount()}`);
  });

  // Handle private message between user and admin
  socket.on("private-message", ({ senderId, receiverId, message, senderName, senderRole, isAdmin }) => {
    console.log(`Private message: ${senderName} (${senderId}) -> ${receiverId}`);
    
    const receiverInfo = onlineUsers.get(receiverId);
    
    const messageData = {
      senderId,
      receiverId,
      message,
      senderName,
      senderRole,
      isAdmin,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    };
    
    if (receiverInfo) {
      // Send to specific receiver
      io.to(receiverInfo.socketId).emit("new-message", messageData);
      console.log(`Message delivered to ${receiverId}`);
    } else {
      console.log(`Receiver ${receiverId} not online`);
    }
    
    // Send confirmation back to sender
    socket.emit("message-sent", {
      ...messageData,
      delivered: !!receiverInfo
    });
  });

  // Handle typing indicators
  socket.on("typing", ({ receiverId, isTyping, senderName }) => {
    const receiverInfo = onlineUsers.get(receiverId);
    
    if (receiverInfo) {
      io.to(receiverInfo.socketId).emit("typing", { 
        senderId: socket.userId, 
        isTyping, 
        senderName,
        timestamp: new Date()
      });
    }
  });

  // Handle get online users request
  socket.on("get-online-users", () => {
    console.log(`Sending online users list to ${socket.userId}:`, getOnlineUsersArray().length, 'users');
    socket.emit("online-users-list", getOnlineUsersArray());
  });

  // Handle admin status check
  socket.on("check-admin-status", () => {
    const adminCount = getOnlineAdminsCount();
    const statusData = { 
      isOnline: adminCount > 0,
      adminCount,
      onlineAdmins: adminCount
    };
    
    console.log(`Admin status check for ${socket.userId}:`, statusData);
    socket.emit("admin-status", statusData);
  });

  // Handle room joining for specific conversations
  socket.on("join-conversation", ({ conversationId }) => {
    socket.join(conversationId);
    console.log(`User ${socket.userId} joined conversation: ${conversationId}`);
  });

  // Handle leaving conversation
  socket.on("leave-conversation", ({ conversationId }) => {
    socket.leave(conversationId);
    console.log(`User ${socket.userId} left conversation: ${conversationId}`);
  });

  // Handle user status updates
  socket.on("update-status", ({ status }) => {
    if (socket.userId) {
      const userInfo = onlineUsers.get(socket.userId);
      if (userInfo) {
        userInfo.status = status;
        userInfo.lastSeen = new Date();
        
        // Broadcast status update with consistent data structure
        socket.broadcast.emit("user-status-update", {
          userId: socket.userId,
          userName: socket.userName,
          role: socket.userRole,
          status,
          timestamp: new Date()
        });
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);
    
    const userSocketInfo = socketToUser.get(socket.id);
    if (userSocketInfo) {
      const { userId, userName, role } = userSocketInfo;
      
      // Remove user from online users
      onlineUsers.delete(userId);
      socketToUser.delete(socket.id);
      
      console.log(`User ${userName} (${role}) disconnected`);
      
      // Create offline user data
      const offlineUserData = {
        userId,
        userName,
        role,
        isOnline: false,
        timestamp: new Date(),
        reason
      };
      
      // Broadcast to all clients that user went offline
      socket.broadcast.emit("user-offline", offlineUserData);
      
      // Send updated online users list to all clients
      io.emit("online-users-list", getOnlineUsersArray());
      
      console.log(`Updated stats - Total: ${onlineUsers.size}, Admins: ${getOnlineAdminsCount()}`);
    }
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
    socket.emit("error-response", {
      message: "Connection error occurred",
      error: error.message
    });
  });

  // Heartbeat mechanism
  socket.on("ping", () => {
    socket.emit("pong");
  });
});

// Cleanup disconnected sockets periodically
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  for (const [userId, userInfo] of onlineUsers.entries()) {
    if (now - userInfo.joinedAt.getTime() > TIMEOUT) {
      const socket = io.sockets.sockets.get(userInfo.socketId);
      if (!socket || !socket.connected) {
        console.log(`Cleaning up disconnected user: ${userId}`);
        onlineUsers.delete(userId);
        
        // Find and remove from socketToUser
        for (const [socketId, socketInfo] of socketToUser.entries()) {
          if (socketInfo.userId === userId) {
            socketToUser.delete(socketId);
            break;
          }
        }
        
        // Broadcast user offline
        io.emit("user-offline", {
          userId,
          userName: userInfo.userName,
          role: userInfo.role,
          isOnline: false,
          timestamp: new Date(),
          reason: 'timeout'
        });
      }
    }
  }
}, 60000); // Check every minute

// Middleware
app.use(cors({ 
  origin: process.env.CLIENT_URL || "http://localhost:3000", 
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Make io available to routes
app.set("io", io);

// Add socket info to requests
app.use((req, res, next) => {
  req.io = io;
  req.onlineUsers = onlineUsers;
  req.getOnlineUsersArray = getOnlineUsersArray;
  req.getOnlineAdminsCount = getOnlineAdminsCount;
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chats", chatRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    socket: {
      connected: io.engine.clientsCount,
      totalOnline: onlineUsers.size,
      admins: getOnlineAdminsCount(),
      users: onlineUsers.size - getOnlineAdminsCount()
    }
  });
});

// Error Handler
app.use(errorHandler);

// MongoDB Connection & Server Start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO server ready`);
      console.log(`CORS origin: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

export { io };
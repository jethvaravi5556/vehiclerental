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

// Store online users and connections
const onlineUsers = new Map(); // userId -> { socketId, userInfo }
const adminSockets = new Map(); // adminId -> socketId
const userSockets = new Map(); // userId -> socketId
const socketToUser = new Map(); // socketId -> userId

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // User joins with their ID and role
  socket.on("join", ({ userId, role, isAdmin }) => {
    console.log(`👤 User joining: ${userId} (${role})`);
    
    socket.userId = userId;
    socket.userRole = role;
    socket.isAdmin = isAdmin;
    
    // Store user info
    onlineUsers.set(userId, {
      socketId: socket.id,
      role,
      isAdmin,
      joinedAt: new Date()
    });
    
    socketToUser.set(socket.id, userId);
    
    if (isAdmin) {
      adminSockets.set(userId, socket.id);
      console.log("👨‍💼 Admin joined:", userId);
      
      // Notify all users that admin is online
      socket.broadcast.emit("admin-status", { 
        isOnline: true,
        adminCount: adminSockets.size 
      });
    } else {
      userSockets.set(userId, socket.id);
      console.log("👤 User joined:", userId);
      
      // Notify admins about new user online
      adminSockets.forEach((adminSocketId) => {
        io.to(adminSocketId).emit("user-online", { 
          userId, 
          socketId: socket.id,
          timestamp: new Date()
        });
      });
    }
    
    // Send connection confirmation to the user
    socket.emit("connection-status", { 
      isConnected: true, 
      onlineAdmins: adminSockets.size > 0,
      adminCount: adminSockets.size,
      userCount: userSockets.size
    });

    console.log(`📊 Online stats - Admins: ${adminSockets.size}, Users: ${userSockets.size}`);
  });

  // Handle private message between user and admin
  socket.on("private-message", ({ senderId, receiverId, message, senderName, isAdmin }) => {
    console.log(`💬 Private message: ${senderName} (${senderId}) -> ${receiverId}`);
    
    const receiverInfo = onlineUsers.get(receiverId);
    
    const messageData = {
      senderId,
      receiverId,
      message,
      senderName,
      isAdmin,
      timestamp: new Date(),
      id: Date.now() + Math.random() // Temporary ID for UI
    };
    
    if (receiverInfo) {
      // Send to specific receiver
      io.to(receiverInfo.socketId).emit("private-message", messageData);
      console.log(`✅ Message delivered to ${receiverId}`);
    } else {
      console.log(`❌ Receiver ${receiverId} not online`);
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

  // Handle message read status
  socket.on("message-read", ({ messageId, readBy }) => {
    socket.broadcast.emit("message-read", { 
      messageId, 
      readBy,
      readAt: new Date()
    });
  });

  // Admin specific: Get all online users
  socket.on("get-online-users", () => {
    if (socket.isAdmin) {
      const onlineUsersList = Array.from(userSockets.entries()).map(([userId, socketId]) => {
        const userInfo = onlineUsers.get(userId);
        return {
          userId,
          socketId,
          isOnline: true,
          role: userInfo?.role || 'user',
          joinedAt: userInfo?.joinedAt
        };
      });
      
      socket.emit("online-users-list", onlineUsersList);
      console.log(`📋 Sent online users list to admin ${socket.userId}: ${onlineUsersList.length} users`);
    }
  });

  // User specific: Check if admin is online
  socket.on("check-admin-status", () => {
    const adminCount = adminSockets.size;
    socket.emit("admin-status", { 
      isOnline: adminCount > 0,
      adminCount 
    });
    console.log(`❓ Admin status check: ${adminCount > 0 ? 'Online' : 'Offline'} (${adminCount} admins)`);
  });

  // Handle room joining for specific conversations
  socket.on("join-conversation", ({ conversationId }) => {
    socket.join(conversationId);
    console.log(`🏠 User ${socket.userId} joined conversation: ${conversationId}`);
  });

  // Handle leaving conversation
  socket.on("leave-conversation", ({ conversationId }) => {
    socket.leave(conversationId);
    console.log(`🚪 User ${socket.userId} left conversation: ${conversationId}`);
  });

  // Handle user status updates
  socket.on("update-status", ({ status }) => {
    if (socket.userId) {
      const userInfo = onlineUsers.get(socket.userId);
      if (userInfo) {
        userInfo.status = status;
        userInfo.lastSeen = new Date();
        
        // Broadcast status update
        socket.broadcast.emit("user-status-update", {
          userId: socket.userId,
          status,
          timestamp: new Date()
        });
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    
    const userId = socketToUser.get(socket.id);
    if (userId) {
      onlineUsers.delete(userId);
      socketToUser.delete(socket.id);
      
      if (socket.isAdmin) {
        adminSockets.delete(userId);
        console.log("👨‍💼 Admin disconnected:", userId);
        
        // Notify all users about admin status change
        socket.broadcast.emit("admin-status", { 
          isOnline: adminSockets.size > 0,
          adminCount: adminSockets.size 
        });
      } else {
        userSockets.delete(userId);
        console.log("👤 User disconnected:", userId);
        
        // Notify admins about user going offline
        adminSockets.forEach((adminSocketId) => {
          io.to(adminSocketId).emit("user-offline", { 
            userId,
            timestamp: new Date(),
            reason 
          });
        });
      }
      
      console.log(`📊 Updated stats - Admins: ${adminSockets.size}, Users: ${userSockets.size}`);
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
        console.log(`🧹 Cleaning up disconnected user: ${userId}`);
        onlineUsers.delete(userId);
        socketToUser.delete(userInfo.socketId);
        adminSockets.delete(userId);
        userSockets.delete(userId);
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
  req.adminSockets = adminSockets;
  req.userSockets = userSockets;
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
      admins: adminSockets.size,
      users: userSockets.size
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
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.IO server ready`);
      console.log(`🌐 CORS origin: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

export { io };
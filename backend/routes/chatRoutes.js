import express from "express";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get conversation between logged-in user and another user
router.get("/conversation/:receiverId", authenticate, async (req, res) => {
  try {
    const { receiverId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await ChatMessage.getConversation(
      req.user._id, 
      receiverId, 
      parseInt(limit)
    );
    
    // Mark messages as read
    await ChatMessage.markAsRead(receiverId, req.user._id);
    
    res.json({
      messages: messages.reverse(), // Show oldest first
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Failed to load conversation" });
  }
});

// Send a message
router.post("/send", authenticate, async (req, res) => {
  try {
    const { receiverId, message, messageType = 'text' } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }
    
    const chatMessage = await ChatMessage.create({
      sender: req.user._id,
      receiver: receiverId,
      message: message.trim(),
      messageType,
      senderIsAdmin: req.user.role === 'admin',
      conversationId: [req.user._id, receiverId].sort().join('_')
    });
    
    // Populate sender and receiver info
    await chatMessage.populate('sender', 'name email role avatar');
    await chatMessage.populate('receiver', 'name email role avatar');
    
    // Get Socket.IO instance from app
    const io = req.app.get("io");
    if (io) {
      // Emit to receiver if online
      io.emit("new-message", {
        ...chatMessage.toObject(),
        isNew: true
      });
    }
    
    res.status(201).json(chatMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Get all conversations for admin
router.get("/admin/conversations", authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const conversations = await ChatMessage.getAdminConversations(req.user._id);
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching admin conversations:", error);
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

// Get all conversations for regular user
router.get("/user/conversations", authenticate, async (req, res) => {
  try {
    // Get all admins that user has chatted with
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", req.user._id] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", req.user._id] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "admin"
        }
      },
      {
        $unwind: "$admin"
      },
      {
        $match: {
          "admin.role": "admin"
        }
      },
      {
        $project: {
          admin: {
            _id: "$admin._id",
            name: "$admin.name",
            email: "$admin.email",
            avatar: "$admin.avatar"
          },
          lastMessage: "$lastMessage",
          unreadCount: "$unreadCount"
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);
    
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

// Get unread message count
router.get("/unread-count", authenticate, async (req, res) => {
  try {
    const count = await ChatMessage.getUnreadCount(req.user._id);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to get unread count" });
  }
});

// Mark conversation messages as read
router.put("/mark-read/:senderId", authenticate, async (req, res) => {
  try {
    const { senderId } = req.params;
    await ChatMessage.markAsRead(senderId, req.user._id);
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

// Get all admins for user to start conversation
router.get("/admins", authenticate, async (req, res) => {
  try {
    const admins = await User.find(
      { role: 'admin' },
      { name: 1, email: 1, avatar: 1, isOnline: 1 }
    ).sort({ name: 1 });
    
    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Failed to load admins" });
  }
});

// Delete a message (soft delete)
router.delete("/:messageId", authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Check if user is sender or admin
    if (message.sender.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }
    
    // Soft delete by updating the message content
    message.message = "This message has been deleted";
    message.isDeleted = true;
    await message.save();
    
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
});

export default router;
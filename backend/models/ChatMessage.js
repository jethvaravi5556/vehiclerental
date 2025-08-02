import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  senderIsAdmin: {
    type: Boolean,
    default: false
  },
  conversationId: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
chatMessageSchema.index({ sender: 1, receiver: 1 });
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ receiver: 1, isRead: 1 });

// Static method to get conversation between two users
chatMessageSchema.statics.getConversation = async function(userId1, userId2, limit = 50) {
  return this.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 }
    ],
    isDeleted: false
  })
  .populate('sender', 'name email role avatar')
  .populate('receiver', 'name email role avatar')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to mark messages as read
chatMessageSchema.statics.markAsRead = async function(senderId, receiverId) {
  return this.updateMany(
    {
      sender: senderId,
      receiver: receiverId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to get unread count for a user
chatMessageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    receiver: userId,
    isRead: false,
    isDeleted: false
  });
};

// Static method to get admin conversations
chatMessageSchema.statics.getAdminConversations = async function(adminId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(adminId) },
          { receiver: new mongoose.Types.ObjectId(adminId) }
        ],
        isDeleted: false
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", new mongoose.Types.ObjectId(adminId)] },
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
                  { $eq: ["$receiver", new mongoose.Types.ObjectId(adminId)] },
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
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $match: {
        "user.role": { $ne: "admin" }
      }
    },
    {
      $project: {
        user: {
          _id: "$user._id",
          name: "$user.name",
          email: "$user.email",
          avatar: "$user.avatar",
          role: "$user.role"
        },
        lastMessage: "$lastMessage",
        unreadCount: "$unreadCount"
      }
    },
    {
      $sort: { "lastMessage.createdAt": -1 }
    }
  ]);
};

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
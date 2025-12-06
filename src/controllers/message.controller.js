import { Message } from "../models/message.model.js";
import { Match } from "../models/match.model.js";
import { User } from "../models/user.model.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver ID and content are required" });
    }

    const match = await Match.findOne({
      $or: [
        { requester: senderId, recipient: receiverId, status: { $in: ["accepted", "mutual"] } },
        { requester: receiverId, recipient: senderId, status: { $in: ["accepted", "mutual"] } },
      ],
    });

    if (!match) {
      return res.status(403).json({ message: "You can only message matched users" });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email")
      .populate("receiver", "name email");

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ message: "Other user ID is required" });
    }

    const match = await Match.findOne({
      $or: [
        { requester: userId, recipient: otherUserId, status: { $in: ["accepted", "mutual"] } },
        { requester: otherUserId, recipient: userId, status: { $in: ["accepted", "mutual"] } },
      ],
    });

    if (!match) {
      return res.status(403).json({ message: "You can only view conversations with matched users" });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getAllConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: -1 });

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0,
        });
      } else {
        const conversation = conversationsMap.get(otherUserId);
        if (msg.createdAt > conversation.lastMessage.createdAt) {
          conversation.lastMessage = msg;
        }
      }

      if (msg.receiver._id.toString() === userId && !msg.read) {
        const conversation = conversationsMap.get(otherUserId);
        conversation.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.status(200).json({ conversations });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: "Other user ID is required" });
    }

    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: userId,
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};


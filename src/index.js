import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/connectDB.js";
import mainRouter from "./routes/route.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { Message } from "./models/message.model.js";
import { Match } from "./models/match.model.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8080;

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: true, // Allow all origins when credentials is true
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api", mainRouter);

io.use(async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;
    
    if (!token) {
      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        if (tokenMatch) {
          token = decodeURIComponent(tokenMatch[1]);
        }
      }
    }
    
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error(`Authentication error: ${err.message}`));
  }
});

io.on("connection", (socket) => {
  socket.join(`user_${socket.userId}`);

  socket.on("get_conversations", async () => {
    try {
      const messages = await Message.find({
        $or: [{ sender: socket.userId }, { receiver: socket.userId }],
      })
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: -1 });

      const conversationsMap = new Map();

      messages.forEach((msg) => {
        const otherUser = msg.sender._id.toString() === socket.userId ? msg.receiver : msg.sender;
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

        if (msg.receiver._id.toString() === socket.userId && !msg.read) {
          const conversation = conversationsMap.get(otherUserId);
          conversation.unreadCount += 1;
        }
      });

      const conversations = Array.from(conversationsMap.values()).sort(
        (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      );

      socket.emit("conversations_list", { conversations });
    } catch (error) {
      socket.emit("error", { message: error.message || "Failed to fetch conversations" });
    }
  });

  socket.on("get_conversation", async (data) => {
    try {
      const { otherUserId } = data;
      
      if (!otherUserId) {
        socket.emit("error", { message: "Other user ID is required" });
        return;
      }

      const messages = await Message.find({
        $or: [
          { sender: socket.userId, receiver: otherUserId },
          { sender: otherUserId, receiver: socket.userId },
        ],
      })
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: 1 });

      await Message.updateMany(
        {
          sender: otherUserId,
          receiver: socket.userId,
          read: false,
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
          },
        }
      );


      socket.emit("conversation_messages", {
        otherUserId,
        messages,
      });
    } catch (error) {
      socket.emit("error", { message: error.message || "Failed to fetch conversation" });
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const { receiverId, content } = data;

      const match = await Match.findOne({
        $or: [
          { requester: socket.userId, recipient: receiverId, status: { $in: ["accepted", "mutual"] } },
          { requester: receiverId, recipient: socket.userId, status: { $in: ["accepted", "mutual"] } },
        ],
      });

      if (!match) {
        socket.emit("error", { message: "You can only message matched users" });
        return;
      }

      const message = new Message({
        sender: socket.userId,
        receiver: receiverId,
        content: content.trim(),
      });

      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name email")
        .populate("receiver", "name email");

      io.to(`user_${receiverId}`).emit("receive_message", populatedMessage);
      
      io.to(`user_${receiverId}`).emit("conversation_updated", {
        otherUserId: socket.userId,
        lastMessage: populatedMessage,
      });
      
      socket.emit("message_sent", populatedMessage);
      
      socket.emit("conversation_updated", {
        otherUserId: receiverId,
        lastMessage: populatedMessage,
      });
    } catch (error) {
      socket.emit("error", { message: error.message || "Failed to send message" });
    }
  });

  const onlineUsers = new Set();
  onlineUsers.add(socket.userId);
  
  socket.broadcast.emit("user_online", { userId: socket.userId });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.userId);
    socket.broadcast.emit("user_offline", { userId: socket.userId });
  });
});

connectDB();

httpServer.listen(PORT, () => {
});

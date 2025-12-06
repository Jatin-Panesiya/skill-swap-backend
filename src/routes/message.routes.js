import { Router } from "express";
import {
  sendMessage,
  getConversation,
  getAllConversations,
  markAsRead,
} from "../controllers/message.controller.js";
import { authenticate } from "../middlewares/Authenticate.js";

const messageRouter = Router();

messageRouter.post("/send", authenticate, sendMessage);
messageRouter.get("/conversation/:otherUserId", authenticate, getConversation);
messageRouter.get("/conversations", authenticate, getAllConversations);
messageRouter.post("/mark-read", authenticate, markAsRead);

export default messageRouter;


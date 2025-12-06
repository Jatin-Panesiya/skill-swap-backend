import { Router } from "express";
import {
  sendMatchRequest,
  acceptMatch,
  rejectMatch,
  getAcceptedMatches,
  getPendingRequests,
  getSentRequests,
  withdrawMatchRequest,
} from "../controllers/match.controller.js";
import { authenticate } from "../middlewares/Authenticate.js";

const matchRouter = Router();

matchRouter.post("/send-request", authenticate, sendMatchRequest);
matchRouter.post("/accept", authenticate, acceptMatch);
matchRouter.post("/reject", authenticate, rejectMatch);
matchRouter.post("/withdraw", authenticate, withdrawMatchRequest);
matchRouter.get("/accepted", authenticate, getAcceptedMatches);
matchRouter.get("/pending", authenticate, getPendingRequests);
matchRouter.get("/sent", authenticate, getSentRequests);

export default matchRouter;


import { Router } from "express";
import {
  getActiveMatches,
  getLoggedInUser,
  getUserById,
  getUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/Authenticate.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", logoutUser);
userRouter.put("/update-user/:id", authenticate, updateUser);
userRouter.get("/get-user", authenticate, getLoggedInUser);
userRouter.get("/get-user/:id", authenticate, getUserById);
userRouter.get("/get-all", authenticate, getUsers);
userRouter.get("/get-active-matches", authenticate, getActiveMatches);

export default userRouter;

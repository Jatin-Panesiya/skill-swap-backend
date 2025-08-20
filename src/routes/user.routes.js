import { Router } from "express";
import {
  getActiveMatches,
  getLoggedInUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", logoutUser);
userRouter.put("/update-user/:id", updateUser);
userRouter.get("/get-user", getLoggedInUser);
userRouter.get("/get-active-matches/:id", getActiveMatches);

export default userRouter;

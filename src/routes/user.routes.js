import { Router } from "express";
import {
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

export default userRouter;

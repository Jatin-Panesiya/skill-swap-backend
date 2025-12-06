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
  getAllUsersAdmin,
  deleteUserAdmin,
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/Authenticate.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", logoutUser);
userRouter.put("/update-user/:id", authenticate, updateUser);
userRouter.get("/get-user", authenticate, getLoggedInUser);
userRouter.get("/get-user/:id", authenticate, getUserById);
userRouter.get("/get-all", authenticate, getUsers);
userRouter.get("/get-active-matches", authenticate, getActiveMatches);

userRouter.get("/admin/get-all-users", authenticate, isAdmin, getAllUsersAdmin);
userRouter.delete("/admin/delete-user/:id", authenticate, isAdmin, deleteUserAdmin);

export default userRouter;

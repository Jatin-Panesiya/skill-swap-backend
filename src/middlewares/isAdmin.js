import { User } from "../models/user.model.js";
import { USER_ROLES } from "../utils/constants.js";

export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};


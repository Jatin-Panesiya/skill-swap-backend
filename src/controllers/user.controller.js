import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/utils.js";
import { USER_ROLES } from "../utils/constants.js";

export const registerUser = async (req, res) => {
  try {
    const { email, password, name, role, teachSkills, learnSkills } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (role && role !== USER_ROLES.USER && role !== USER_ROLES.ADMIN) {
      return res.status(400).json({ message: "Invalid role. Must be USER or ADMIN" });
    }

    if (!teachSkills || !Array.isArray(teachSkills) || teachSkills.length === 0) {
      return res.status(400).json({ message: "At least one teaching skill is required" });
    }

    if (!learnSkills || !Array.isArray(learnSkills) || learnSkills.length === 0) {
      return res.status(400).json({ message: "At least one learning skill is required" });
    }

    const newUser = new User({
      email,
      password,
      name,
      teachSkills,
      learnSkills,
      ...(role && { role }),
    });

    await newUser.save();

    const token = generateToken({ userId: newUser._id });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res
      .status(201)
      .json({ user: newUser, message: "User registered and logged in successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isValidUser = await bcrypt.compare(password, user.password);

    if (!isValidUser) {
      return res.status(400).json({ message: "Password is wrong" });
    }

    const token = generateToken({ userId: user._id });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ message: "User logged in successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getLoggedInUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User id is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { new: true }
    );

    res.status(201).json({ user, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getActiveMatches = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const query = {
      _id: { $ne: userId },
      role: { $ne: USER_ROLES.ADMIN },
      teachSkills: { $in: user.learnSkills },
      learnSkills: { $in: user.teachSkills }
    };

    const matches = await User.find(query);

    res.status(200).json({ matches });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const search = req.query.search;
    const filterKey = req.query.filterKey;

    const query = {
      _id: { $ne: userId },
      role: { $ne: USER_ROLES.ADMIN },
    };

    if (search && filterKey === "name") {
      query.name = { $regex: search, $options: "i" }
    } else if (search && filterKey === "skill") {
      query.teachSkills = { $regex: search, $options: "i" }
    }

    const users = await User.find(query);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const deleteUserAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user.userId;

    if (userId === currentUserId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};
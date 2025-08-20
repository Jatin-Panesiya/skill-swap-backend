import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/utils.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newUser = new User({
      email,
      password,
      name,
    });

    await newUser.save();
    res
      .status(201)
      .json({ user: newUser, message: "User registered successfully" });
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
      httpOnly: true, // 🔒 prevents JS access
      secure: true, // 🔒 only over HTTPS
      sameSite: "strict", // ⛔️ CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ message: "User logged in successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getLoggedInUser = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.userId).select("-password");
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
      secure: true,
      sameSite: "strict",
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

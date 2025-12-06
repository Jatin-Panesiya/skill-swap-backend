import { Booking } from "../models/booking.model.js";
import { Match } from "../models/match.model.js";
import { User } from "../models/user.model.js";

export const createBooking = async (req, res) => {
  try {
    const requesterId = req.user.userId;
    const { providerId, skill, date, time, notes } = req.body;

    if (!providerId || !skill || !date || !time) {
      return res.status(400).json({ message: "Provider ID, skill, date, and time are required" });
    }

    if (requesterId === providerId) {
      return res.status(400).json({ message: "Cannot book a session with yourself" });
    }

    const match = await Match.findOne({
      $or: [
        { requester: requesterId, recipient: providerId, status: { $in: ["accepted", "mutual"] } },
        { requester: providerId, recipient: requesterId, status: { $in: ["accepted", "mutual"] } },
      ],
    });

    if (!match) {
      return res.status(403).json({ message: "You can only book sessions with users who have accepted your match request" });
    }

    const provider = await User.findById(providerId);
    if (!provider.teachSkills.includes(skill)) {
      return res.status(400).json({ message: "Provider does not teach this skill" });
    }

    const booking = new Booking({
      requester: requesterId,
      provider: providerId,
      skill,
      date: new Date(date),
      time,
      notes: notes?.trim(),
      status: "pending",
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("requester", "name email")
      .populate("provider", "name email");

    res.status(201).json({ booking: populatedBooking, message: "Booking request created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      provider: userId,
      status: "pending",
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking request not found" });
    }

    booking.status = "confirmed";
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("requester", "name email")
      .populate("provider", "name email");

    res.status(200).json({ booking: populatedBooking, message: "Booking confirmed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      provider: userId,
      status: "pending",
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking request not found" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({ message: "Booking request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getUpcomingBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const bookings = await Booking.find({
      $or: [{ requester: userId }, { provider: userId }],
      date: { $gte: now },
      status: { $in: ["pending", "confirmed"] },
    })
      .populate("requester", "name email")
      .populate("provider", "name email")
      .sort({ date: 1, time: 1 });

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getPastBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const bookings = await Booking.find({
      $and: [
        { $or: [{ requester: userId }, { provider: userId }] },
        {
          $or: [
            { date: { $lt: now } },
            { status: { $in: ["cancelled", "completed"] } },
          ],
        },
      ],
    })
      .populate("requester", "name email")
      .populate("provider", "name email")
      .sort({ date: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bookings = await Booking.find({
      $or: [{ requester: userId }, { provider: userId }],
    })
      .populate("requester", "name email")
      .populate("provider", "name email")
      .sort({ date: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getPendingBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bookings = await Booking.find({
      provider: userId,
      status: "pending",
    })
      .populate("requester", "name email")
      .populate("provider", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [{ requester: userId }, { provider: userId }],
      status: { $in: ["pending", "confirmed"] },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found or cannot be cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};


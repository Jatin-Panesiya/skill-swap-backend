import { Match } from "../models/match.model.js";
import { User } from "../models/user.model.js";

export const sendMatchRequest = async (req, res) => {
  try {
    const requesterId = req.user.userId;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({ message: "Cannot send match request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const existingMatch = await Match.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingMatch) {
      return res.status(400).json({ message: "Match request already exists" });
    }

    const reverseMatch = await Match.findOne({
      requester: recipientId,
      recipient: requesterId,
      status: "pending",
    });

    let match;
    if (reverseMatch) {
      reverseMatch.status = "mutual";
      reverseMatch.isMutual = true;
      await reverseMatch.save();

      match = new Match({
        requester: requesterId,
        recipient: recipientId,
        status: "mutual",
        isMutual: true,
      });
      await match.save();
    } else {
      match = new Match({
        requester: requesterId,
        recipient: recipientId,
        status: "pending",
      });
      await match.save();
    }

    const populatedMatch = await Match.findById(match._id)
      .populate("requester", "name email")
      .populate("recipient", "name email");

    res.status(201).json({ match: populatedMatch, message: reverseMatch ? "Mutual match created!" : "Match request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const acceptMatch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ message: "Match ID is required" });
    }

    const match = await Match.findOne({
      _id: matchId,
      recipient: userId,
      status: "pending",
    });

    if (!match) {
      return res.status(404).json({ message: "Match request not found" });
    }

    match.status = "accepted";
    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate("requester", "name email")
      .populate("recipient", "name email");

    res.status(200).json({ match: populatedMatch, message: "Match accepted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const rejectMatch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ message: "Match ID is required" });
    }

    const match = await Match.findOne({
      _id: matchId,
      recipient: userId,
      status: "pending",
    });

    if (!match) {
      return res.status(404).json({ message: "Match request not found" });
    }

    match.status = "rejected";
    await match.save();

    res.status(200).json({ message: "Match request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getAcceptedMatches = async (req, res) => {
  try {
    const userId = req.user.userId;

    const matches = await Match.find({
      $or: [
        { requester: userId, status: { $in: ["accepted", "mutual"] } },
        { recipient: userId, status: { $in: ["accepted", "mutual"] } },
      ],
    })
      .populate("requester", "name email teachSkills learnSkills")
      .populate("recipient", "name email teachSkills learnSkills")
      .sort({ updatedAt: -1 });

    const formattedMatches = matches.map((match) => {
      const otherUser = match.requester._id.toString() === userId ? match.recipient : match.requester;
      return {
        _id: match._id,
        user: otherUser,
        status: match.status,
        isMutual: match.isMutual,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      };
    });

    res.status(200).json({ matches: formattedMatches });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const matches = await Match.find({
      recipient: userId,
      status: "pending",
    })
      .populate("requester", "name email teachSkills learnSkills")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests: matches });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const matches = await Match.find({
      requester: userId,
      status: "pending",
    })
      .populate("recipient", "name email teachSkills learnSkills")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests: matches });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const withdrawMatchRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ message: "Match ID is required" });
    }

    const match = await Match.findOne({
      _id: matchId,
      requester: userId,
      status: "pending",
    });

    if (!match) {
      return res.status(404).json({ message: "Match request not found" });
    }

    await Match.findByIdAndDelete(matchId);

    res.status(200).json({ message: "Match request withdrawn successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};


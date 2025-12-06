import { model, Schema } from "mongoose";

const matchSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "mutual"],
      default: "pending",
    },
    isMutual: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

matchSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const Match = model("match", matchSchema);


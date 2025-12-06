import { model, Schema } from "mongoose";

const bookingSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    skill: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Booking = model("booking", bookingSchema);


import mongoose, { mongo } from "mongoose";

// Scheme for rooms
const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    is_group: { type: Boolean, default: true },
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    messages: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // References User object
        content: String,
        timestamp: { type: Date, default: Date.now },
        readBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook to enforce room constraints
roomSchema.pre("save", function (next) {
  const participants = this.participants || [];

  if (!this.is_group && participants.length !== 2) {
    return next(
      new Error("Direct message rooms must have exactly 2 participants")
    );
  }
  if (this.is_group && participants.length < 2) {
    return next(new Error("Group rooms must have at least 2 participants"));
  }
  next();
});

roomSchema.index({ "participants._id": 1 }); // Index on 'participants.id'

const Room = mongoose.model("Room", roomSchema); // Create a model from the schema

export default Room; // Export the model

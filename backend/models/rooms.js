import mongoose, { mongo } from "mongoose";

// Scheme for rooms
const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    is_group: { type: Boolean, default: true },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // References User object
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema); // Create a model from the schema

roomSchema.index({ "participants._id": 1 }); // Index on 'participants.id'

export default Room; // Export the model

import mongoose, { mongo } from "mongoose";

// Scheme for rooms
const roomSchema = new mongoose.Schema(
  {
    participants: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String },
        _id: false, // Prevents automatic creation of _id for each participant
      },
    ],
    messages: [
      {
        sender: String,
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema); // Create a model from the schema

roomSchema.index({ "participants.id": 1 }); // Index on 'participants.id'

export default Room; // Export the model

import mongoose, { mongo } from "mongoose";

// Scheme for rooms
const roomSchema = new mongoose.Schema(
  {
    room_id: mongoose.Schema.Types.ObjectId,
    participants: [String],
    messages: [
      {
        sender: String,
        content: String,
        timestamp: Date,
      },
    ],
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema); // Create a model from the schema

export default Room; // Export the model

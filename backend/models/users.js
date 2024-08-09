import { is } from "date-fns/locale";
import mongoose from "mongoose";

// UPDATE THIS SCHEME TO INCLUDE PASSWORD, EMAIL, ETC.

// Create a new schema for users
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Username must be unique
  },
  rooms: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId, // Ensure room ID is an ObjectId
        ref: "Room", // Reference to Room model if you need to populate later
      },
      name: String,
      is_group: Boolean,
      _id: false, // Prevents automatic creation of _id for each participant
    },
  ], // Reference to the rooms the user is in
  password: { type: String, required: true }, // Password field
  is_online: { type: Boolean, default: false }, // Set default value for is_online
});

userSchema.index({ username: 1 }); // Index the username field

const User = mongoose.model("User", userSchema); // Create a model from the schema

export default User; // Export the model

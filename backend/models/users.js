import mongoose from "mongoose";

// Schema for Users collection
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  username: {
    type: String,
    required: true,
    unique: true, // Username must be unique
  },
  rooms: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room", // Reference to Room model for population
      },
      // name: String,
      // is_group: Boolean,
      _id: false, // Prevents automatic creation of _id
    },
  ], // Reference to the rooms the user is in
  password: { type: String, required: true },
  palette: { type: String, default: "default" },
  birthday: { type: Date, required: true },
  interests: [{ type: String }],
  socials: {
    facebook: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
  }, // Social media fields
});

userSchema.index({ username: 1 }); // Index the username field

const User = mongoose.model("User", userSchema); // Create a model from the schema

export default User;

import mongoose from "mongoose";

// UPDATE THIS SCHEME TO INCLUDE PASSWORD, EMAIL, ETC.

// Create a new schema for users
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  rooms: [{ type: String, required: true }],
});

const User = mongoose.model("User", userSchema); // Create a model from the schema

export default User; // Export the model

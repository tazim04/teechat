import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
});

const Message = mongoose.model("Message", messageSchema); // Create a model from the schema

export default Message; // Export the model

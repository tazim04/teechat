import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import mongoose from "mongoose";
import Rooms from "./models/rooms.js";
import Users from "./models/users.js";

const app = express(); // Express server, function handler for HTTP server
const server = createServer(app); // HTTP express server
const uri =
  "mongodb+srv://tazim720:sEmi6GzM5S68SO49@messaging-app-cluster.jq4v6uf.mongodb.net/messaging-app?retryWrites=true&w=majority&appName=messaging-app-cluster";

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function runMongoDB() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process with failure
  }
}
runMongoDB().catch(console.dir); // Run the function and catch any errors

// Add message to room in the database
async function addMessage(roomID, message) {
  const room = await Rooms.findById(roomID); // Find the room by the ID
  await room.updateOne({ $push: { messages: message } }); // Add the message to the room
}

// Find room by participants - direct messaging
async function findContact(sender, recipient) {
  console.log("(findContact) Sender:", sender);
  let sender_rooms = sender.rooms; // Get the rooms for the sender

  for (let room of sender_rooms) {
    if (room.name === recipient.username && room.is_group === false) {
      const roomData = await Rooms.findById(room.id); // Find the room by ID
      return roomData; // Return the room
    }
  }
  return null; // Return null if the room is not found
}

// // Get all rooms for a user
// async function getUserRooms(user) {
//   let rooms = [];
//   let user_rooms = user.rooms; // Get the rooms for the user
//   console.log("User rooms:", user_rooms);
//   for (let room of user_rooms) {
//     let roomData = await Rooms.findById(room); // Find the room by ID and populate the participants
//     rooms.push(roomData.messages); // Add the messages to the array
//   }
//   return rooms; // Return the messages
// }

let users = []; // Array to store users
let rooms = []; // Array to store rooms

// Set io with cors options
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Listen for a "connection" event
io.on("connection", (socket) => {
  socket.once("join_server", async (username) => {
    const user = await Users.findOne({ username: username }); // Get user from database
    console.log(user);

    // Check if the user exists
    if (!user) {
      console.log("User not found:", username);
      return;
    }

    console.log("User joined server", username); // Log the user joining the server

    // User object with socket ID to store in the array
    const user_withSocketID = {
      id: user._id,
      username: user.username,
      rooms: user.rooms,
      socket_id: socket.id,
    };
    users.push(user_withSocketID); // Add the user to the array

    // Emit the list of users to the new user
    socket.emit("update_user_list", users);

    // Emit the updated list to all users
    io.emit("update_user_list", users);

    console.log(users);
  });

  // socket.on("get_previous_messages", async (username, other_user) => {
  //   const user = await Users.findOne({ username: username }); // Find the user by username
  //   const other = await Users.findOne({ username: other_user }); // Find the other user by username

  //   let room = findRoom(user, other); // Find the room between the user and other user

  //   let messages = room.messages; // Get the messages from the room

  //   console.log("Previous messages ():", messages);

  //   io.to(socket.id).emit("recieve_previous_messages", messages); // Emit previous messages to the user
  // });

  // NOT IMPLEMENTED YET - ROOMS

  // Listen for a "dm" event, direct messaging
  socket.on("dm", async (content, to_socket_id, to, from) => {
    console.log("Message received:", content, from); // Log the message

    const sender = await Users.findOne({ username: from }); // Find the sender by username
    const recipient = await Users.findOne({ username: to }); // Find the recipient by username

    if (!sender || !recipient) {
      console.log("User not found:", to, sender);
      return;
    }

    let recipient_socket_id = users.find(
      (recipient) => recipient.username === to
    ).socket_id; // Find the recipient's socket ID

    let room = await findContact(sender, recipient); // Find the room between the sender and recipient
    console.log("(dm event)Room:", room);

    let room_id = room._id; // Get the room ID
    console.log("(dm event)Room ID:", room_id);

    const messageData = {
      sender: sender.username,
      content,
      timestamp: new Date(),
    };

    addMessage(room_id, messageData); // Add the message to the room
    io.to(to_socket_id).emit("recieve_message", messageData); // Emit the message to the recipient's socket.id
  });

  socket.on("disconnect", () => {
    const userIndex = users.findIndex((user) => user.id === socket.id); // Find index of the user by socket.id

    // Check if the user exists
    if (userIndex !== -1) {
      console.log("User disconnected", users[userIndex]);

      // Remove the user from the array
      users.splice(userIndex, 1);

      // Emit the updated list to all users
      io.emit("update_user_list", users);
    }

    console.log(users);
  });
});

server.listen(3000, () => {
  // Start the server and listen on port 3000
  console.log("Listening on port 3000");
});

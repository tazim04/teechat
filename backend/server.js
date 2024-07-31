import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import cors from "cors";

const app = express(); // Express server, function handler for HTTP server
const server = createServer(app); // HTTP express server

let users = []; // Array to store users
const messages = { general: [] }; // Object to store messages

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Listen for a "connection" event
io.on("connection", (socket) => {
  socket.on("join_server", (username) => {
    const user = {
      username,
      id: socket.id,
    };
    io.emit(`User joined: ${user.username}`); // Emit a message to all clients
    users.push(user); // Add the user to the users array
  });

  socket.on("join_room", (room, callBack) => {
    socket.join(room); // Join the room
    callBack(messages[room]); // Get the previous messages in the room
    io.to(room).emit("Room joined"); // Emit a message to the room
  });

  socket.on("message", ({ content, sender, to, isRoom, roomName }) => {
    // check if the message is for a room (group chat) or a user (dm)
    if (isRoom) {
      const messageData = {
        content,
        roomName,
        sender,
      };
      socket.to(to).emit("message", messageData); // Emit the message to the room
    } else {
      const messageData = {
        content,
        roomName: sender, // Set the room name to the sender
        sender,
      };
      socket.to(to).emit("message", messageData); // Emit the message to the recipient
    }
    if (messages[roomName]) {
      messages[roomName].push({ sender, content }); // Add the message to the list of messages
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id); // Log the disconnection
  });
});

server.listen(3000, () => {
  // Start the server and listen on port 3000
  console.log("Listening on port 3000");
});

import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import cors from "cors";

const app = express(); // Express server, function handler for HTTP server
const server = createServer(app); // HTTP express server

let users = []; // Array to store users
// const messages = { general: [] }; // Object to store messages

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Listen for a "connection" event
io.on("connection", (socket) => {
  socket.once("join_server", (username) => {
    console.log("User joined server", username); // Log the user joining the server

    // Emit the list of users to the new user
    socket.emit("update_user_list", Array.from(users.values()));

    // Broadcast the updated user list to all users
    io.emit("update_user_list", Array.from(users.values()));

    const user = {
      username,
      id: socket.id,
    };
    // io.emit("user_join", `User joined: ${user.username}`); // Emit a message to all clients

    users.push(user); // Add the user to the array

    // Emit the updated list to all users
    io.emit("update_user_list", users);

    console.log(users);
  });

  // NOT IMPLEMENTED YET - ROOMS
  // socket.on("join_room", (room, callBack) => {
  //   socket.join(room); // Join the room
  //   callBack(messages[room]); // Get the previous messages in the room
  //   io.to(room).emit("Room joined"); // Emit a message to the room
  // });

  // socket.on("message", (content, sender, to, isRoom) => {
  //   console.log("Message received:", content, sender, to, isRoom); // Log the message
  //   // check if the message is for a room (group chat) or a user (dm)
  //   if (isRoom) {
  //     const messageData = {
  //       content,
  //       roomName: to, // Set the room name to the recipient, a room/group chat
  //       sender,
  //     };
  //     socket.to(to).emit("recieve_message", messageData); // Emit the message to the room
  //     console.log(messageData);
  //   } else {
  //     console.log("Not a room, sending to " + to);
  //     const messageData = {
  //       content,
  //       roomName: to, // Set the room name to the sender
  //       sender,
  //     };
  //     socket.to(to).emit("recieve_message", messageData); // Emit the message to the recipient
  //     console.log(messageData);
  //   }
  //   // if (messages[roomName]) {
  //   //   messages[roomName].push({ sender, content }); // Add the message to the list of messages
  //   // }
  // });

  // Listen for a "dm" event, direct messaging
  socket.on("dm", (content, to, sender) => {
    console.log("Message received:", content, to); // Log the message

    const messageData = {
      content,
      to,
      sender,
    };
    socket.to(to).emit("recieve_message", messageData); // Emit the message to the recipient
    console.log(messageData);
    // if (messages[roomName]) {
    //   messages[roomName].push({ sender, content }); // Add the message to the list of messages
    // }
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

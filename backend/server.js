import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import mongoose, { set } from "mongoose";
import Rooms from "./models/rooms.js";
import Users from "./models/users.js";

const app = express();
const server = createServer(app);

const uri =
  "mongodb+srv://tazim720:sEmi6GzM5S68SO49@messaging-app-cluster.jq4v6uf.mongodb.net/messaging-app?retryWrites=true&w=majority&appName=messaging-app-cluster";

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function runMongoDB() {
  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}
runMongoDB().catch(console.dir);

async function add_message_in_db(roomID, message) {
  const room = await Rooms.findById(roomID);
  await room.updateOne({ $push: { messages: message } });
}

async function get_previous_messages(roomID) {
  const room = await Rooms.findById(roomID);
  let prev_messages = room.messages;
  return prev_messages;
}

async function find_room_in_db(sender, recipient) {
  let sender_rooms = sender.rooms;

  for (let room of sender_rooms) {
    if (room.name === recipient.username && room.is_group === false) {
      const roomData = await Rooms.findById(room.id);
      return roomData;
    }
  }
  return null;
}

let socket_ids = {}; // Dictionary to store username as key and socket_id as value
let messages_cache = {}; // Implement caching properly

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("sign_in", async (username, password) => {
    const user = await Users.findOne({ username: username });

    if (user && user.password === password) {
      console.log("User signed in:", username);
      socket.emit("sign_in_response", true);
    } else {
      console.log("User not found or password incorrect:", username);
      socket.emit("sign_in_response", false);
    }
  });

  socket.once("join_server", async (username) => {
    const user = await Users.findOne({ username: username }); // Get user from database

    if (!user) {
      console.log("User not found:", username);
      return;
    }

    console.log("User joined server:", username);

    // Add the user to the socket_ids dictionary
    socket_ids[username] = socket.id;
    io.emit("receive_online_users", Object.keys(socket_ids)); // Emit the updated list of online users

    console.log("Current online users:", socket_ids); // Log the list of online users
  });

  socket.on("fetch_rooms", async (username) => {
    const user = await Users.findOne({ username: username });
    let rooms = user.rooms;
    console.log("Fetching rooms: ", rooms);
    socket.emit("receive_rooms", rooms);
  });

  socket.on("get_previous_messages", async (room_id) => {
    console.log("Fetching previous messages for room:", room_id);
    if (messages_cache[room_id]) {
      console.log("Messages found in cache.");
      io.to(socket.id).emit(
        "recieve_previous_messages",
        messages_cache[room_id]
      );
    } else {
      let prevMessages = await get_previous_messages(room_id);
      console.log("Messages not in cache, fetching from DB.");
      messages_cache[room_id] = prevMessages;
      io.to(socket.id).emit("recieve_previous_messages", prevMessages);
    }
  });

  socket.on("fetch_online_users", () => {
    console.log("Fetching online users");
    io.emit("receive_online_users", Object.keys(socket_ids)); // Emit the list of online users
  });

  socket.on("dm", async (content, room_id, to, from, is_group) => {
    console.log("Message received:", content, "from", from);

    if (!is_group) {
      const sender = await Users.findOne({ username: from });
      const recipient = await Users.findOne({ username: to });

      if (!sender || !recipient) {
        console.log("User not found:", to, sender);
        return;
      }

      const messageData = {
        sender: sender.username,
        content,
        timestamp: new Date(),
      };

      await add_message_in_db(room_id, messageData);

      console.log("Message saved in DB, adding to cache.");
      messages_cache[room_id].push(messageData); // Add the message to the cache

      let recipient_socket_id = socket_ids[to]; // Get the recipient's socket ID from the dictionary

      if (recipient_socket_id) {
        io.to(recipient_socket_id).emit("recieve_message", messageData);
      } else {
        console.log(`${to} is offline, message not sent but saved in DB`);
      }
    } else {
      // Group messaging
    }
  });

  socket.on("create_account", async (email, username, password) => {
    console.log(
      "Creating account for:",
      username +
        " with the following data: email: " +
        email +
        " password: " +
        password
    );
    const existing_email = await Users.findOne({ email });
    const existing_username = await Users.findOne({ username });
    if (existing_email) {
      const response = "existing email";
      console.log("Email already exists");
      socket.emit("account_created", response);
      return;
    }
    if (existing_username) {
      const response = "existing username";
      console.log("Username already exists");
      socket.emit("account_created", response);
      return;
    }
    const user = new Users({
      email,
      username,
      rooms: [],
      password,
    });
    const response = { username, password };
    try {
      await user.save();
      console.log("Account created for:", username);
      socket.emit("account_created", response);
    } catch (error) {
      console.log("Error creating account:", error);
      socket.emit("account_created", null);
    }
  });

  socket.on("fetch_all_users", async () => {
    const users = await Users.find({});
    let allUsers = [];
    users.forEach((user) => {
      allUsers.push(user.username);
    });
    console.log("All users:", allUsers);
    io.emit("receive_all_users", allUsers);
  });

  socket.on("disconnect", () => {
    const username = Object.keys(socket_ids).find(
      (key) => socket_ids[key] === socket.id
    );

    if (username) {
      console.log("User disconnected:", username);
      delete socket_ids[username]; // Remove the user from the dictionary
      console.log("Current online users:", socket_ids);
    }

    io.emit("receive_online_users", Object.keys(socket_ids)); // Emit the updated list of online users
  });
});

server.listen(3000, () => {
  console.log("Listening on port 3000");
});

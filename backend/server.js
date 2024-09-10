import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import mongoose, { set } from "mongoose";
import Rooms from "./models/rooms.js";
import Users from "./models/users.js";
import { create } from "node:domain";

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

  const messageData = {
    sender: message.sender,
    content: message.content,
    timestamp: message.timestamp,
  };
  await room.updateOne({ $push: { messages: messageData } });
}

async function get_previous_messages(roomID) {
  console.log("get_previous_messages:", roomID);
  // Find the room and populate the sender field with the user data, specifically the username
  const room = await Rooms.findById(roomID).populate({
    path: "messages.sender",
    model: "User",
    select: "username", // Select only the username and ID
  });
  let prev_messages = room.messages;
  console.log("Previous messages:", prev_messages);
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

async function create_room(sender, recipient) {
  // check if the room already exists
  const existing_room = await find_room_in_db(sender, recipient);
  if (existing_room) {
    console.log(
      "Room already exists between:",
      sender.username,
      recipient.username
    );
    return;
  }

  async function get_username_by_id(id) {
    const user = await Users.findById(id);
    return user.username;
  }

  console.log("Creating room between:", sender, recipient);

  // initialize the room
  const room = new Rooms({
    participants: [sender._id, recipient._id],
    messages: [],
  });

  // save the room to the database
  await room.save();

  // add the room to both sender and recipients room list
  await sender.updateOne({
    $push: {
      rooms: { id: room._id, name: recipient.username, is_group: false },
    },
  });
  await recipient.updateOne({
    $push: { rooms: { id: room._id, name: sender.username, is_group: false } },
  });
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
      const { password, ...userWithoutPassword } = user.toObject(); // Remove the password from the user object before sending it to the client
      socket.emit("sign_in_response", true, userWithoutPassword);
    } else {
      console.log("User not found or password incorrect:", username);
      socket.emit("sign_in_response", false);
    }
  });

  socket.once("join_server", async (user) => {
    console.log(user);
    const userDB = await Users.findOne({ username: user.username }); // Get user from database

    if (!userDB) {
      console.log("User not found:", user);
      return;
    }

    console.log("User joined server:", user);

    // Add the user to the socket_ids dictionary
    socket_ids[user.username] = socket.id;
    io.emit("receive_online_users", Object.keys(socket_ids)); // Emit the updated list of online users

    console.log("Current online users:", socket_ids); // Log the list of online users
  });

  socket.on("fetch_rooms", async (username) => {
    const user = await Users.findOne({ username: username });

    try {
      let rooms = user.rooms;
      console.log("Fetching rooms: ", rooms);
      socket.emit("receive_rooms", rooms);
    } catch (error) {
      console.log("There was an error fetching rooms:", error);
    }
  });

  socket.on("get_previous_messages", async (room) => {
    console.log("Fetching previous messages for room:", room);

    const roomID = room.id;

    // Check if the messages are in the cache
    if (messages_cache[roomID]) {
      console.log("Messages found in cache.");
      io.to(socket.id).emit(
        "recieve_previous_messages",
        messages_cache[roomID]
      );
    } else {
      console.log("Messages not in cache, fetching from DB.");
      let prevMessages = await get_previous_messages(roomID); // Fetch the previous messages from the database
      messages_cache[roomID] = prevMessages;
      io.to(socket.id).emit("recieve_previous_messages", prevMessages);
    }
  });

  socket.on("fetch_online_users", () => {
    console.log("Fetching online users");
    io.emit("receive_online_users", Object.keys(socket_ids)); // Emit the list of online users
  });

  // Create a room with a user, no group messaging yet
  socket.on("create_room", async (user, recipient) => {
    console.log("Creating room with:", user, recipient);

    const user_db = await Users.findOne({ username: user }); // Find the user in the database
    const recipient_db = await Users.findOne({ username: recipient }); // Find the recipient in the database

    console.log("User found:", user_db);

    // Check if the user and recipient exist, shouldn't happen
    if (!user_db || !recipient_db) {
      console.log("User not found:", user, recipient);
      return;
    }

    await create_room(user_db, recipient_db); // Create a room with the user and recipient in the database and save it to each user

    const user_socket_id = socket_ids[user]; // Get the user's socket ID from the dictionary
    const recipient_socket_id = socket_ids[recipient.username]; // Get the recipient's socket ID from the dictionary

    // Fetch the updated room lists for both users
    const updatedUserRooms = await Users.findById(user_db._id).select("rooms");
    const updatedRecipientRooms = await Users.findById(recipient_db._id).select(
      "rooms"
    );

    // Emit the updated room lists to both users
    io.to(socket_ids[user]).emit("receive_rooms", updatedUserRooms.rooms);
    io.to(socket_ids[recipient]).emit(
      "receive_rooms",
      updatedRecipientRooms.rooms
    );

    console.log(`Updated rooms for ${user}:`, updatedUserRooms.rooms);
    console.log(`Updated rooms for ${recipient}:`, updatedRecipientRooms.rooms);

    // Emit a message to the recipient to notify them of the new room
    io.to(recipient_socket_id).emit(
      "recieve_message",
      `${user} has created a room with you!`
    );
  });

  socket.on("delete_room", async (room_id) => {
    console.log("Deleting room:", room_id);
    try {
      // Find the room and populate participants with full user data
      const room = await Rooms.findById(room_id).populate("participants");

      // Check if the room exists, do nothing if it doesn't
      if (!room) {
        console.log("Room not found:", room_id);
        return;
      }

      const participants = room.participants; // Get the participants of the room (all ids)

      console.log("Participants:", participants);

      // Remove the room from the participants' room lists
      for (const participant of participants) {
        const user = await Users.findById(participant.id); // Find the user in the Users collection
        console.log("Deleting room from:", user.username);

        // Ensure the user exists
        if (user) {
          await user.updateOne({ $pull: { rooms: { id: room_id } } }); // Remove the room from the user's room list
        }
      }

      // Delete the room from the database
      await Rooms.deleteOne({ _id: room_id });

      console.log(`Room ${room_id} deleted successfully.`);

      // Emit the updated room lists to the participants
      for (const participant of participants) {
        const updatedRooms = await Users.findById(participant._id).select(
          "rooms"
        );
        if (participant) {
          const updatedRooms = await Users.findById(participant._id).select(
            "rooms"
          );
          io.to(socket_ids[participant.username]).emit(
            "receive_rooms",
            updatedRooms.rooms
          );
        }
      }

      // Emit a message to the participants to notify them of the deletion (not implemented yet)
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  });

  // Send a direct message to a user, from => user.id, to => room name, room_id is the id in Room collection
  socket.on("dm", async (content, room_id, to, from, is_group) => {
    if (!is_group) {
      // Direct messaging between two users
      const sender = await Users.findOne({ _id: from });
      const recipient = await Users.findOne({ username: to });

      console.log("Message received:", content, "from", sender);

      // Check if the sender and recipient exist
      if (!sender || !recipient) {
        console.log("User not found:", to, sender);
        return;
      }

      const messageData = {
        sender: sender._id,
        content,
        timestamp: new Date(),
      };

      await add_message_in_db(room_id, messageData); // Add the message to the database

      console.log("messageData:", messageData);

      // Store the message in cache with format for the frontend
      const messageData_cache = {
        sender: { _id: sender._id, username: sender.username },
        content,
        timestamp: new Date(),
      };

      console.log("Message saved in DB, adding to cache.");
      messages_cache[room_id].push(messageData_cache); // Add the message to the cache

      let recipient_socket_id = socket_ids[to]; // Get the recipient's socket ID from the dictionary

      const message_to_send = {
        sender: { _id: sender._id, username: sender.username },
        content,
        timestamp: new Date(),
      };

      if (recipient_socket_id) {
        io.to(recipient_socket_id).emit("recieve_message", message_to_send);
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

    // Check if the email or username already exists
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

    // Create a new user with the provided data and save it to the database if it doesn't already exist
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

  // Set the user's palette in the database
  socket.on("set_palette", async (username, palette) => {
    console.log("Setting palette for:", username, palette);
    const user = await Users.findOne({ username: username });

    if (!user) {
      console.log("User not found:", username);
      return;
    }

    await user.updateOne({ palette: palette }); // Update the user's palette in the database
    console.log("Palette updated for:", username, palette);
  });

  socket.on("fetch_palette", async (username) => {
    const user = await Users.findOne({ username: username });
    console.log("Fetching palette for:", username, user.palette);
    socket.emit("users_palette", user.palette); // Emit the user's palette to the client
  });
});

server.listen(3000, () => {
  console.log("Listening on port 3000");
});

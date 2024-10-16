import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import mongoose, { set } from "mongoose";
import jwt from "jsonwebtoken";
import http from "http";
import Rooms from "./models/rooms.js";
import Users from "./models/users.js";
import { create } from "node:domain";
import dotenv from "dotenv";
import Room from "./models/rooms.js";

dotenv.config();

const app = express();
const server = createServer(app);

const uri = process.env.MONGODB_URI; // get uri from .env

const JWT_SECRET = process.env.JWT_SECRET; // get jwt secret from .env

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow request
    } else {
      callback(new Error("Not allowed by CORS")); // Reject request
    }
  },
  credentials: true, // Allow credentials (cookies, etc.)
};

app.use(cors(corsOptions));

// CORS configuration for Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

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

io.use((socket, next) => {
  const accessToken = socket.handshake.auth.accessToken;
  const authorizedPage = socket.handshake.auth.authorizedPage;

  // if the page is authorized, let it connect (login or signup)
  if (authorizedPage) {
    console.log("This page is allowed to pass.");
    return next();
  }

  if (accessToken) {
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          socket.emit("token_expired"); // Notify the client to refresh the token
          return next(new Error("Authentication error: token expired"));
        }
        return next(new Error("Authentication error: invalid token"));
      }
      socket.user = decoded;
      next();
    });
  } else {
    return next(new Error("Authentication error: access token is required")); // Reject connection without token
  }
});

// Dictionaries for storing socket IDs and messages
let socket_ids = {}; // Dictionary to store username as key and socket_id as value
let messages_cache = {}; // Implement caching properly

async function add_message_in_db(roomID, message) {
  const room = await Rooms.findById(roomID);

  const messageData = {
    sender: message.sender,
    content: message.content,
    timestamp: message.timestamp,
  };
  await room.updateOne({ $push: { messages: messageData } });

  const updatedRoom = await Rooms.findById(roomID).select("messages -_id");

  const updatedMessage = updatedRoom.messages[updatedRoom.messages.length - 1];
  return updatedMessage;
}

async function get_previous_messages(roomID) {
  // console.log("get_previous_messages:", roomID);

  // Find the room and populate the sender field with the user data, specifically the username
  const room = await Rooms.findById(roomID)
    .populate({
      path: "messages.sender",
      model: "User",
      select: "username", // Select only the username and ID
    })
    .lean();
  let prev_messages = room.messages;
  // console.log("Previous messages:", prev_messages);
  return prev_messages;
}

async function find_room_in_db(sender, recipient) {
  let sender_rooms = sender.rooms;

  for (let room of sender_rooms) {
    const r = room.id; // room.id now contains the full room data, due to populate
    if (r.name === recipient.username && r.is_group === false) {
      const roomData = await Rooms.findById(room.id);
      return roomData;
    }
  }
  return null;
}

async function getRoomsWithNames(user) {
  // console.log("getRoomsWithNames:", user);
  if (!user) {
    console.log("getRoomsWithNames: User not found:", user);
    return []; // Return an empty array if the user is not found
  }
  const user_populatedRooms = await Users.findById(user._id)
    .populate({
      path: "rooms",
      populate: "participants",
    })
    .exec();

  // sort rooms by last updated
  user_populatedRooms.rooms.sort((a, b) => b.updatedAt - a.updatedAt);

  const rooms = user_populatedRooms?.rooms.map((room) => {
    if (room.is_group) {
      // console.log(room.name, "is a group room");
      room.name = room.name; // Set the room name to the group chat name
    } else {
      // console.log("Room is not a group room");
      room.name = room.participants.find(
        (participant) => participant.username !== user.username
      ).username; // Set the room name to the other participant's username
    }
    // console.log("Room name:", room.name);
    return room;
  });
  return rooms;
}

// Create a room between two users and save it to the database
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

  console.log("Creating room between:", sender, recipient);

  // initialize the room
  const room = new Rooms({
    name: null,
    is_group: false,
    participants: [sender._id, recipient._id],
    messages: [],
  });

  // save the room to the database
  await room.save();

  // add the room to both sender and recipients room list
  await sender.updateOne({
    $push: {
      rooms: room._id,
    },
  });
  await recipient.updateOne({
    $push: { rooms: room._id },
  });
}
// participants is an array of user objects {_id, username}
async function create_room_gc(participants, roomName) {
  // for gc, no need to check if the room already exists

  let participants_ids = participants.map((participant) => participant._id);

  const room = new Rooms({
    name: roomName,
    is_group: true,
    participants: participants_ids,
    messages: [],
  }); // Create a new room with the participants
  await room.save(); // Save the room to the database

  // Add the room to each participant's room list
  for (const participant of participants) {
    const user = await Users.findById(participant); // Find the user in the Users collection
    await participant.updateOne({
      $push: {
        rooms: room._id,
      },
    });
  }
  return room;
}

// JWT Token generation
const generateAccessToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "15m" }); // 15 minutes
};
const generateRefreshToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" }); // 7 days
};

io.on("connection", (socket) => {
  socket.on("sign_in", async (username, password) => {
    try {
      const user = await Users.findOne({ username: username });

      if (!user) {
        console.log("sign_in: user not found", username);
        return socket.emit("sign_in_response", {
          success: false,
        });
      }

      const doesPasswordMatch = await user.comparePassword(password);

      if (doesPasswordMatch) {
        // console.log("User signed in:", username);
        const { password, ...userWithoutPassword } = user.toObject(); // Remove the password from the user object before sending it to the client

        // generate JWT token here
        const accessToken = generateAccessToken(userWithoutPassword);
        const refreshToken = generateRefreshToken(userWithoutPassword);

        socket.emit("sign_in_response", {
          success: true,
          user: userWithoutPassword,
          accessToken,
          refreshToken,
        });
      } else {
        console.log("User not found or password incorrect:", username);
        socket.emit("sign_in_response", false);
      }
    } catch (e) {
      console.log("There was an error with trying to sign in!", e);
    }
  });

  socket.on("refresh_access_token", async (refreshToken, callback) => {
    if (!refreshToken) {
      return callback({ error: "Refresh token required" });
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return callback({ error: "Invalid refresh token" });
      }

      console.log("user from token: ", user);

      const { exp, iat, ...userWithoutExp } = user; // remove the JWT specific fields, new ones will be generated

      // Generate a new access token
      const newAccessToken = generateAccessToken(userWithoutExp);

      callback({ accessToken: newAccessToken }); // Send new token back to the client
    });
  });

  socket.on("join_server", async (user) => {
    console.log("join_server:", user);
    const userDB = await Users.findOne({ username: user.username }); // Get user from database

    if (!userDB) {
      console.log("join_server: User not found:", user);
      return;
    }

    console.log("User joined server:", user);

    // Add the user to the socket_ids dictionary
    socket_ids[user._id] = socket.id;
    io.emit("receive_online_users", Object.keys(socket_ids)); // Emit the updated list of online users

    // console.log("Current online users:", socket_ids); // Log the list of online users

    const rooms = user.rooms; // Get the user's rooms, this will be used to subscribe to all group rooms
    let rooms_to_join = [];
    if (rooms) {
      for (const room of rooms) {
        if (room.is_group) {
          console.log("Joining group room:", room);
          rooms_to_join.push(room.id);
        }
      }
    }
    socket.join(rooms_to_join); // Join all group rooms
  });

  socket.on(
    "create_account",
    async (email, username, password, birthday, interests, socials) => {
      console.log(
        "Creating account for:",
        username +
          " with the following data: " +
          email +
          " " +
          password +
          " " +
          birthday +
          " " +
          interests +
          " " +
          socials
      );

      const existing_email = await Users.findOne({ email });
      const existing_username = await Users.findOne({ username });

      // Check if the email or username already exists
      if (existing_email) {
        const response = {
          success: false,
          reason: "email",
        };
        socket.emit("account_created", response);
        return;
      }
      if (existing_username) {
        const response = {
          success: false,
          reason: "username",
        };
        // console.log("Username already exists");
        socket.emit("account_created", response);
        return;
      }

      // Create a new user with the provided data and save it to the database if it doesn't already exist
      const user = new Users({
        email,
        username,
        rooms: [],
        password,
        birthday,
        interests,
        socials,
      });

      const { password: pass, ...userWithoutPassword } = user.toObject(); // Remove the password from the user object before sending it to the client
      const accessToken = generateAccessToken(userWithoutPassword);
      const refreshToken = generateRefreshToken(userWithoutPassword);

      // sinced rooms is empty, no need to send it to the client on account creation
      const response = {
        success: true,
        user: userWithoutPassword,
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
      try {
        await user.save(); // Save the user to the database
        console.log("Account created for:", username);
        console.log("response:", response);
        socket.emit("account_created", response);
        // socket.emit("users_palette", "default");
      } catch (error) {
        console.log("Error creating account:", error);
        socket.emit("account_created", null);
      }
    }
  );

  socket.on("check_existing_user", async (data) => {
    console.log("Checking ", data);
    const existing_email = await Users.findOne({ email: data.email });
    const existing_username = await Users.findOne({ username: data.username });

    console.log("existing email:", existing_email, !!existing_email);
    console.log("existing username:", existing_username, !!existing_username);

    const response = {
      emailExists: !!existing_email,
      usernameExists: !!existing_username,
    };

    // Emit the response back to the client
    socket.emit("user_check_result", response);
  });

  socket.on("fetch_rooms", async (username) => {
    // console.log("Fetching rooms for:", username);

    try {
      const user = await Users.findOne({ username: username });
      const rooms = await getRoomsWithNames(user); // Get the rooms with the other participant's username as the room name

      // console.log("Rooms:", rooms);
      socket.emit("receive_rooms", rooms);
    } catch (error) {
      console.log("There was an error fetching rooms:", error);
      socket.emit("receive_rooms", []); // Emit an empty array if there is an error
    }
  });

  socket.on("fetch_all_users", async () => {
    const users = await Users.find({});
    let allUsers = [];
    users.forEach((user) => {
      allUsers.push({ _id: user._id, username: user.username });
    });
    // console.log("All users:", allUsers);
    io.emit("receive_all_users", allUsers);
  });

  socket.on("get_previous_messages", async (room) => {
    // console.log("Fetching previous messages for room:", room);

    try {
      const roomID = room._id;

      console.log("Room ID:", roomID);

      // Join the room if it's a group room and the socket is not already in the room
      if (room.is_group && !socket.rooms.has(room._id)) {
        console.log("Joining group room:", room._id);
        socket.join(roomID); // Join the group room
      }

      // Check if the messages are in the cache
      if (messages_cache[roomID]) {
        // console.log("Messages found in cache.");
        io.to(socket.id).emit(
          "recieve_previous_messages",
          messages_cache[roomID]
        );
      } else {
        // console.log("Messages not in cache, fetching from DB.");
        let prevMessages = await get_previous_messages(roomID); // Fetch the previous messages from the database
        messages_cache[roomID] = prevMessages;
        io.to(socket.id).emit("recieve_previous_messages", prevMessages);
      }
    } catch (error) {
      console.log("There was an error fetching previous messages:", error);
      io.to(socket.id).emit("recieve_previous_messages", []); // Emit an empty array if there is an error
    }
  });

  socket.on("fetch_last_message", async (room_id) => {
    try {
      const room = await Rooms.findById(room_id).select("messages").lean();

      if (room && room.messages && room.messages.length > 0) {
        const last_message = await fetch_last_message(room);

        socket.emit("recieve_last_message", last_message);
      } else {
        // no messages
        socket.emit("recieve_last_message", {
          room_id: room._id,
          lastMessage: null,
        });
      }
    } catch (e) {
      console.log("error fetching last message", e);
      return;
    }
  });

  const fetch_last_message = async (room) => {
    const lastMessage = room.messages[room.messages.length - 1];

    const sender = await Users.findById(lastMessage.sender); // get the senders information based on the stored _id

    lastMessage.sender = sender; // update with full info

    return {
      room_id: room._id, // include room._id
      ...lastMessage,
    };
  };

  socket.on("fetch_online_users", () => {
    // console.log("Fetching online users");
    io.emit("receive_online_users", Object.keys(socket_ids)); // Emit the list of online users
  });

  // Create a room with a user, user & recipient {_id, username}
  socket.on("create_room", async (user, recipient) => {
    try {
      console.log("Creating room with:", user.username, recipient.username);

      const user_db = await Users.findOne({ _id: user._id }).populate({
        path: "rooms",
        populate: { path: "participants", select: "username" },
      }); // Find the user in the database and populate the 'rooms' field

      const recipient_db = await Users.findOne({ _id: recipient._id }).populate(
        {
          path: "rooms",
          populate: { path: "participants", select: "username" },
        }
      ); // Find the recipient in the database and populate the 'rooms' field

      // Check if the user and recipient exist, shouldn't happen
      if (!user_db || !recipient_db) {
        console.log("create_room: User not found:", user, recipient);
        return;
      }

      await create_room(user_db, recipient_db); // Create a room with the user and recipient in the database and save it to each user

      const user_socket_id = socket_ids[user._id]; // Get the user's socket ID from the dictionary
      const recipient_socket_id = socket_ids[recipient._id]; // Get the recipient's socket ID from the dictionary

      const updatedUserRooms = await getRoomsWithNames(user_db);
      const updatedRecipientRooms = await getRoomsWithNames(recipient_db);

      // Emit the updated room lists to both users
      io.to(user_socket_id).emit("receive_rooms", updatedUserRooms);
      io.to(recipient_socket_id).emit("receive_rooms", updatedRecipientRooms);

      socket.emit("room_created", true, recipient.username);
    } catch (e) {
      console.log("Error creating room", e);
      socket.emit("room_created", false, recipient.username);
    }
  });

  // Create a group room with multiple users
  socket.on("create_room_gc", async (users, groupChatName) => {
    console.log("Creating group room with users:", users, groupChatName);

    if (users.length < 2) {
      console.log("Not enough participants to create group room");
      return;
    }

    try {
      let participants = []; // Initialize an empty array to store the participants
      const roomName = groupChatName; // Set the room name to the group chat name

      for (const user of users) {
        const user_db = await Users.findById(user._id); // Find the user in the database
        if (user) {
          participants.push(user_db); // Add the user to the participants array if they exist
        } else {
          console.log("Ucreate_room_gc: ser not found:", user);
        }
      }

      const room = await create_room_gc(participants, roomName); // Create a group room with the participants in the database

      // console.log("Room created in db:", room);

      for (const participant of participants) {
        const participant_socket_id = socket_ids[participant._id]; // Get the participant's socket ID from the dictionary

        // Only do this if the participant is online
        if (participant_socket_id) {
          const participant_updated_rooms = await getRoomsWithNames(
            participant
          );

          io.to(participant_socket_id).emit(
            "receive_rooms",
            participant_updated_rooms
          ); // Emit the updated room list to the participant
        }
      }

      socket.join(room._id); // Join the group room
      socket.emit("group_room_created", true, groupChatName);
    } catch (error) {
      console.log("Error creating group room:", error);
    }
  });

  socket.on("fetch_user", async (user_id, room_id) => {
    try {
      const user = await Users.findById(user_id);
      if (!user) {
        console.log("fetch_user: User not found:", user_id);
        return;
      }

      const room = await Rooms.findById(room_id).populate({
        path: "participants",
        model: "User",
        select: "_id, username email birthday interests socials",
      });

      const other_user = room.participants.find(
        (participant) => participant._id != user_id // Find the other participant in the room
      );

      socket.emit("receive_user", other_user); // Emit the other user to the client
    } catch (error) {
      console.log("Error fetching user:", error);
    }
  });

  socket.on("fetch_room_participants", async (room_id) => {
    const room = await Rooms.findById(room_id).populate({
      path: "participants",
      model: "User",
      select: "_id username email birthday interests socials",
    });

    const participants = room.participants; // Get the participants of the room

    socket.emit("receive_room_participants", participants); // Emit the participants to the client
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

      // Remove the room from the participants' room lists
      for (const participant of participants) {
        const user = await Users.findById(participant.id); // Find the user in the Users collection
        console.log("Deleting room from:", user.username);

        // Ensure the user exists
        if (user) {
          await user.updateOne({ $pull: { rooms: room_id } }); // Remove the room from the user's room list
        }
      }

      // Delete the room from the database
      await Rooms.deleteOne({ _id: room_id });

      console.log(`Room ${room_id} deleted successfully.`);

      // Emit the updated room lists to the participants
      for (const participant of participants) {
        if (participant) {
          const participant_updatedRooms = await Users.findById(
            participant._id
          ).populate({
            path: "rooms",
            populate: { path: "participants", select: "username" },
          });

          const updatedParticipantRooms = await getRoomsWithNames(participant);

          io.to(socket_ids[participant._id]).emit(
            "receive_rooms",
            updatedParticipantRooms
          );
          socket.emit("recieve_rooms", updatedParticipantRooms); // for good measure
        }
      }

      socket.emit("room_deleted", true);

      // Emit a message to the participants to notify them of the deletion (not implemented yet)
    } catch (err) {
      console.error("Error deleting room:", err);

      const room = await Rooms.findById(room_id);

      if (room.is_group) {
        socket.emit("group_room_deleted", false, room.name);
      } else {
        const recipient = room.participants.find(
          (participant) => participant._id.toString() !== user_id
        );
        socket.emit("room_deleted", false, recipient.username);
      }
    }
  });

  // Send a direct message to a user, from => user.id, to => room name, room_id is the id in Room collection
  socket.on("dm", async (content, room_id, to, from, is_group, callback) => {
    // Find the sender in the Users collection
    const sender = await Users.findById(from);
    let recipient = "";
    let recipient_socket_id = "";

    // if its a group chat, grab the room from Rooms via room_id, if its a dm grab the recipient from Users via username
    if (is_group) {
      recipient = await Rooms.findById(room_id);
    } else {
      recipient = await Users.findOne({ username: to });
      recipient_socket_id = socket_ids[recipient._id]; // Get the recipient's socket ID from the dictionary
    }

    console.log("Message received:", content, "from", sender);

    // Check if the sender and recipient exist
    if (!sender || !recipient) {
      console.log("Sender or recipient not found:", sender, recipient);
      return;
    }

    const messageData = {
      sender: sender._id,
      content,
      timestamp: new Date(),
    };

    // Initialize cache for the room if it doesn't exist
    if (!messages_cache[room_id]) {
      messages_cache[room_id] = [];
    }

    // Add the message to the database, get the message thats updated with the db info (_id, readBy array)
    const updatedMessage = await add_message_in_db(room_id, messageData);

    console.log("messageData:", messageData);

    // Store the message in cache with format for the frontend
    const messageData_cache = {
      _id: updatedMessage._id,
      readBy: updatedMessage.readBy,
      sender: { _id: sender._id, username: sender.username },
      content,
      timestamp: new Date(),
    };

    console.log("Message saved in DB, adding to cache.");
    messages_cache[room_id].push(messageData_cache); // Add the message to the cache

    const message_to_send = {
      _id: updatedMessage._id,
      readBy: updatedMessage.readBy,
      sender: { _id: sender._id, username: sender.username },
      content,
      timestamp: new Date(),
      room_id: room_id,
    };

    console.log("Message to send:", message_to_send);

    // Emit the message, if dm send to socket_id, if group send to room_id
    if (is_group) {
      console.log("Sending message to room:", room_id);
      socket.to(room_id).emit("recieve_message", message_to_send);
      const roomWithParticipants = await Rooms.findById(room_id).populate(
        "participants"
      );
      const participants = roomWithParticipants.participants;
      for (const participant of participants) {
        if (socket_ids[participant._id]) {
          const participantsRooms_sorted = await getRoomsWithNames(participant);
          io.to(socket_ids[participant._id]).emit(
            "receive_rooms",
            participantsRooms_sorted
          );

          const room = await Rooms.findById(room_id).select("messages").lean();
          const last_message = await fetch_last_message(room);
          io.to(socket_ids[participant._id]).emit(
            "recieve_last_message",
            last_message
          );
        }
      }
    } else {
      const room = await Rooms.findById(room_id).select("messages").lean();
      if (recipient_socket_id) {
        io.to(recipient_socket_id).emit("recieve_message", message_to_send);

        const last_message = await fetch_last_message(room);
        console.log("Last message:", last_message);
        io.to(recipient_socket_id).emit("recieve_last_message", last_message);

        // updated order of rooms to show last updated
        const sortedRooms_recipient = await getRoomsWithNames(recipient);
        io.to(recipient_socket_id).emit("receive_rooms", sortedRooms_recipient);
        callback(message_to_send);
      } else {
        console.log(`${to} is offline, message not sent but saved in DB`);
      }

      // show sender updated order of rooms
      const sortedRooms_sender = await getRoomsWithNames(sender);
      socket.emit("receive_rooms", sortedRooms_sender);

      const last_message = await fetch_last_message(room);
      socket.emit("recieve_last_message", last_message);
    }
  });

  socket.on("message_read", async (msg_id, room_id, user_id) => {
    if (!msg_id) {
      console.log("msg_id is undefined");
      return;
    }

    try {
      const room = await Rooms.findById(room_id).select("messages");

      if (!room) {
        console.log("Room doesnt exist??");
        return;
      }

      // ensure the user exists
      const user = await Users.findById(user_id);
      if (!user) {
        console.log("User doesnt exist???", user);
        return;
      }

      // find the specific message
      const message = room.messages.find(
        (msg) => msg._id.toString() === msg_id
      );

      console.log("Message read!", message.content);

      if (message.readBy.includes(user_id)) {
        console.log(`${user.username} already read this message`);
        return;
      }
      console.log(
        `Setting message read by ${user.username} for message ${message}`
      );

      message.readBy.push(user_id);

      console.log("Message with updated readBY:", message);

      const sender = await Users.findById(message.sender);

      // update message in cache
      if (messages_cache[room_id]) {
        const cachedMessage = messages_cache[room_id].find(
          (msg) => msg._id.toString() === msg_id
        );
        if (cachedMessage) {
          cachedMessage.readBy.push(user_id); // Update the readBy field in the cache
        }
      }

      await room.save(); // save changes to db

      const sender_socket_id = socket_ids[sender._id];

      io.to(sender_socket_id).emit("message_read_update", message, room_id);
      socket.emit("message_read_update", message, room_id);

      // update last message for client to check if a new message has been read in the side bar
      // io.to(sender_socket_id).emit("recieve_last_message", message);
      // socket.emit("recieve_last_message", message);
    } catch (e) {
      console.log("Error trying to set message as read", e);
    }
  });

  // Add a user to a group room
  socket.on("add_user_to_room", async (room_id, user_id) => {
    try {
      const user = await Users.findById(user_id); // Find the user in the Users collection
      const room = await Rooms.findById(room_id).populate([
        { path: "participants", model: "User", select: "_id username" },
      ]); // Find the room in the Rooms collection

      if (!user || !room) {
        console.log("User or room not found:", user, room);
        return;
      }

      console.log("Adding user to room:", user, user_id, room);

      // Add the user to the room's participants
      await room.updateOne({ $push: { participants: user_id } });

      // Add the room to the user's room list
      await user.updateOne({
        $addToSet: { rooms: room._id },
      });
      console.log("User added to room:", user.username, room.name);

      const updated_participants_room = await Rooms.findById(room_id)
        .select("participants")
        .populate("participants");
      // console.log("Updated participants:", updated_participants_room);

      const updated_participants = updated_participants_room.participants; // Get the updated participants of the room

      io.to(room_id).emit("receive_room_participants", updated_participants); // Emit the updated participants to all participants

      // Emit the updated room list to the user
      const user_updated_rooms = await getRoomsWithNames(user);
      console.log("Updated rooms for:", user_updated_rooms);
      if (socket_ids[user._id]) {
        io.to(socket_ids[user._id]).emit("receive_rooms", user_updated_rooms);
      }
    } catch (e) {
      console.error("Error adding user to room:", e);
    }
  });

  // Remove a user from a group room
  socket.on("remove_user_from_room", async (room_id, user_id) => {
    try {
      const user = await Users.findById(user_id); // Find the user in the Users collection
      const room = await Rooms.findById(room_id).populate([
        { path: "participants", model: "User", select: "_id username" },
      ]); // Find the room in the Rooms collection

      if (!user || !room) {
        console.log("User or room not found:", user, room);
        return;
      }

      console.log("Removing user from room:", user, room);

      // Remove the user from the room's participants
      await room.updateOne({ $pull: { participants: user_id } });

      // Remove the room from the user's room list
      await user.updateOne({
        $pull: { rooms: room_id },
      });

      const updated_participants_room = await Rooms.findById(room_id)
        .select("participants")
        .populate("participants");
      const updated_participants = updated_participants_room.participants; // Get the updated participants of the room

      io.to(room_id).emit("receive_room_participants", updated_participants); // Emit the updated participants to all participants

      // Emit the updated room list to the user
      const user_updated_rooms = await getRoomsWithNames(user);
      console.log("Updated rooms for:", user_updated_rooms);
      if (socket_ids[user._id]) {
        io.to(socket_ids[user._id]).emit("receive_rooms", user_updated_rooms);
      }
    } catch (e) {
      console.error("Error removing user from room:", e);
    }
  });

  socket.on("change_room_name", async (newName, room_id) => {
    try {
      const room = await Rooms.findById(room_id);
      if (!room) {
        console.log("Couldn't change room name, room not found.");
        return;
      }
      console.log("Changing", room.name, "to", newName);

      room.name = newName; // update name
      await room.save();
      socket.emit("recieve_updated_room", room);
    } catch (e) {
      console.log(
        "There was an error trying to change the name of the room to",
        newName
      );
      return;
    }
  });

  socket.on("disconnect", () => {
    const user_id = Object.keys(socket_ids).find(
      (key) => socket_ids[key] === socket.id
    );

    if (user_id) {
      console.log("User disconnected:", user_id);
      delete socket_ids[user_id]; // Remove the user from the dictionary
      console.log("Current online users:", socket_ids);
    }

    io.emit("receive_online_users", Object.keys(socket_ids)); // Emit the updated list of online users
  });

  // Set the user's palette in the database
  socket.on("set_palette", async (username, palette) => {
    console.log("Setting palette for:", username, palette);
    const user = await Users.findOne({ username: username });

    if (!user) {
      console.log("set_palette: User not found:", username);
      return;
    }

    await user.updateOne({ palette: palette }); // Update the user's palette in the database
    console.log("Palette updated for:", username, palette);
  });

  socket.on("fetch_palette", async (user_id) => {
    console.log("fetch_palette:", user_id);
    const user = await Users.findById(user_id);
    console.log("Fetching palette for:", user);
    socket.emit("users_palette", user.palette); // Emit the user's palette to the client
  });
});

server.listen(3000, () => {
  console.log("Listening on port 3000");
});

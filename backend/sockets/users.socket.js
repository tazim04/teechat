import User from "../models/users.js";
import Room from "../models/rooms.js";
import { memory } from "../services/memory.service.js";

export default function usersSocket(io, socket) {
  // Handle a user joining the server
  socket.on("join_server", async (user) => {
    console.log("join_server", user);

    const userDB = await User.findOne({ username: user.username }); // Get user from DB

    if (!userDB) {
      console.log("join_server: User not found:", user);
      return;
    }

    console.log("User joined server:", user);

    // Track online users in memory
    memory.socketIds.set(String(user._id), socket.id);
    io.emit("receive_online_users", Array.from(memory.socketIds.keys())); // Emit the updated list of online users to all clients

    // auto-join group rooms by id
    if (Array.isArray(user.rooms)) {
      const groupRoomIds = user.rooms
        .filter((r) => r.is_group)
        .map((r) => r.id);
      if (groupRoomIds.length) socket.join(groupRoomIds);
    }
  });

  // Fetch all users (id and username only)
  socket.on("fetch_all_users", async () => {
    const users = await User.find({}, "_id username").lean();
    io.emit("receive_all_users", users);
  });

  // Fetch a specific user's details given a room and the requesting user's id
  // TODO: convert into a REST endpoint
  socket.on("fetch_user", async (user_id, room_id) => {
    const room = await Room.findById(room_id).populate({
      path: "participants",
      model: "User",
      select: "_id username email birthday interests socials",
    });
    const otherUser = room.participants.find((p) => !p._id.equals(user_id));

    socket.emit("receive_user", otherUser);
  });

  //  Fetch online users
  socket.on("fetch_online_users", () => {
    io.emit("receive_online_users", Array.from(memory.socketIds.keys()));
  });

  // Check if a username or email already exists
  // TODO: convert into a REST endpoint
  socket.on("check_existing_user", async (data) => {
    console.log("Checking ", data);
    const existing_email = await User.findOne({ email: data.email });
    const existing_username = await User.findOne({ username: data.username });

    console.log("existing email:", existing_email, !!existing_email);
    console.log("existing username:", existing_username, !!existing_username);

    const response = {
      emailExists: !!existing_email,
      usernameExists: !!existing_username,
    };

    // Emit the response back to the client
    socket.emit("user_check_result", response);
  });

  socket.on("disconnect", () => {
    // lookup user by socket id and remove from list of online users
    for (const [uid, sid] of memory.socketIds.entries()) {
      if (sid === socket.id) {
        console.log("User disconnected:", uid);
        memory.socketIds.delete(uid);
      }
    }

    // emit updated online users to all clients
    io.emit("receive_online_users", Array.from(memory.socketIds.keys()));
  });
}

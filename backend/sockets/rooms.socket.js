import User from "../models/users.js";
import Room from "../models/rooms.js";
import { memory } from "../services/memory.service.js";
import {
  getRoomsWithNames,
  createDirectRoom,
  createGroupRoom,
} from "../services/room.service.js";

export default function roomsSocket(io, socket) {
  socket.on("fetch_rooms", async (username) => {
    try {
      const user = await User.findOne({ username });
      const rooms = await getRoomsWithNames(user);
      socket.emit("receive_rooms", rooms);
    } catch (e) {
      socket.emit("receive_rooms", []);
    }
  });

  // Create a room with a user & recipient {_id, username}
  socket.on("create_room", async (user, recipient) => {
    try {
      console.log("Creating room with:", user.username, recipient.username);

      // re-fetch users with populated rooms
      const u = await User.findById(user._id).populate({
        path: "rooms",
        populate: { path: "participants", select: "username" },
      });
      const r = await User.findById(recipient._id).populate({
        path: "rooms",
        populate: { path: "participants", select: "username" },
      });

      // create the room if it doesn't already exist, update both users' room lists
      await createDirectRoom(u, r);

      // fetch updated rooms with names for both users, now includes the new room
      const updatedU = await getRoomsWithNames(u);
      const updatedR = await getRoomsWithNames(r);

      // emit to both users if they're online
      const usid = memory.socketIds.get(String(user._id));
      const rsid = memory.socketIds.get(String(recipient._id));
      if (usid) io.to(usid).emit("receive_rooms", updatedU);
      if (rsid) io.to(rsid).emit("receive_rooms", updatedR);

      socket.emit("room_created", true, recipient.username);
    } catch (e) {
      console.error(e);
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
      const participantDocs = await User.find({
        _id: { $in: users.map((u) => u._id) },
      });

      // create the room, update all users' room lists
      const room = await createGroupRoom(participantDocs, groupChatName);

      // fetch updated rooms with names for all participants, now includes the new room
      // emit to all participants if they're online
      for (const p of participantDocs) {
        const sid = memory.socketIds.get(String(p._id));
        if (sid) {
          const updated = await getRoomsWithNames(p);
          io.to(sid).emit("receive_rooms", updated);
        }
      }

      socket.join(room._id);
      socket.emit("group_room_created", true, groupChatName);
    } catch (e) {
      console.error(e);
      socket.emit("group_room_created", false, groupChatName);
    }
  });

  // Fetch participants of a room
  socket.on("fetch_room_participants", async (roomId) => {
    const room = await Room.findById(roomId).populate({
      path: "participants",
      model: "User",
      select: "_id username email birthday interests socials",
    });
    socket.emit("receive_room_participants", room.participants);
  });

  // Add a user to a room
  socket.on("add_user_to_room", async (roomId, userId) => {
    await Room.updateOne(
      { _id: roomId },
      { $addToSet: { participants: userId } }
    );
    await User.updateOne({ _id: userId }, { $addToSet: { rooms: roomId } });

    const updatedRoom = await Room.findById(roomId)
      .select("participants")
      .populate("participants");

    // Emit updated participants to the room participants
    io.to(roomId).emit("receive_room_participants", updatedRoom.participants);

    // Emit updated rooms list to the added user
    const sid = memory.socketIds.get(String(userId));
    if (sid) {
      const user = await User.findById(userId);
      const rooms = await getRoomsWithNames(user);
      io.to(sid).emit("receive_rooms", rooms);
    }
  });

  // Remove a user from a room
  socket.on("remove_user_from_room", async (roomId, userId) => {
    await Room.updateOne({ _id: roomId }, { $pull: { participants: userId } });
    await User.updateOne({ _id: userId }, { $pull: { rooms: roomId } });

    const updatedRoom = await Room.findById(roomId)
      .select("participants")
      .populate("participants");

    // Emit updated participants to the room participants
    io.to(roomId).emit("receive_room_participants", updatedRoom.participants);

    // Emit updated rooms list to the removed user
    const sid = memory.socketIds.get(String(userId));
    if (sid) {
      const user = await User.findById(userId);
      const rooms = await getRoomsWithNames(user);
      io.to(sid).emit("receive_rooms", rooms);
    }
  });

  // Change the name of a room
  socket.on("change_room_name", async (newName, room_id) => {
    try {
      const room = await Room.findById(room_id);
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

  socket.on("delete_room", async (room_id) => {
    console.log("Deleting room:", room_id);
    try {
      // Find the room and populate participants with full user data
      const room = await Room.findById(room_id).populate("participants");

      // Check if the room exists, do nothing if it doesn't
      if (!room) {
        console.log("Room not found:", room_id);
        return;
      }

      const participants = room.participants; // Get the participants of the room (all ids)

      // Remove the room from the participants' room lists
      for (const participant of participants) {
        const user = await User.findById(participant.id); // Find the user in the Users collection
        console.log("Deleting room from:", user.username);

        // Ensure the user exists
        if (user) {
          await user.updateOne({ $pull: { rooms: room_id } }); // Remove the room from the user's room list
        }
      }

      // Delete the room from the database
      await Room.deleteOne({ _id: room_id });

      console.log(`Room ${room_id} deleted successfully.`);

      // Emit the updated room lists to the participants
      for (const participant of participants) {
        if (participant) {
          const updatedParticipantRooms = await getRoomsWithNames(participant);

          const sid = memory.socketIds.get(String(participant._id));
          if (sid) {
            io.to(sid).emit("receive_rooms", updatedParticipantRooms);
          }

          socket.emit("recieve_rooms", updatedParticipantRooms);
        }
      }

      socket.emit("room_deleted", true);

      // Emit a message to the participants to notify them of the deletion (not implemented yet)
    } catch (err) {
      console.error("Error deleting room:", err);

      const room = await Room.findById(room_id);

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
}

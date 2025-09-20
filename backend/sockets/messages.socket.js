import User from "../models/users.js";
import Room from "../models/rooms.js";
import { memory } from "../services/memory.service.js";
import {
  addMessage,
  getPreviousMessages,
  fetchLastMessage,
  getRoomsWithNames,
} from "../services/room.service.js";

export default function messagesSocket(io, socket) {
  // Fetch previous messages for a room
  socket.on("get_previous_messages", async (room) => {
    const roomId = room._id;

    // join the room if it's a group chat and not already joined
    if (room.is_group && !socket.rooms.has(roomId)) socket.join(roomId);

    // Check cache for previous messages
    if (memory.messagesCache.has(roomId)) {
      io.to(socket.id).emit(
        "recieve_previous_messages",
        memory.messagesCache.get(roomId)
      );
    } else {
      const prev = await getPreviousMessages(roomId);
      memory.messagesCache.set(roomId, prev);
      io.to(socket.id).emit("recieve_previous_messages", prev);
    }
  });

  // Get the most recent message for a room
  socket.on("fetch_last_message", async (roomId) => {
    const lastMessage = await fetchLastMessage(roomId);
    socket.emit(
      "recieve_last_message",
      lastMessage ?? { room_id: roomId, lastMessage: null }
    );
  });

  // Handle sending a direct message or group message
  socket.on("dm", async (content, roomId, to, from, is_group, callback) => {
    try {
      // Find the sender in the DB
      const sender = await User.findById(from);
      if (!sender) {
        console.error("dm: sender not found", from);
        return;
      }

      // Prepare message object
      const messageData = {
        sender: sender._id,
        content,
        timestamp: new Date(),
      };

      // Init cache for the room if missing
      if (!memory.messagesCache.has(roomId)) {
        memory.messagesCache.set(roomId, []);
      }

      // Save message to DB
      const savedMessage = await addMessage(roomId, messageData);

      // Format for client
      const messageToSend = {
        _id: savedMessage._id,
        readBy: savedMessage.readBy,
        sender: { _id: sender._id, username: sender.username },
        content,
        timestamp: savedMessage.timestamp,
        room_id: roomId,
      };

      // Push to cache
      memory.messagesCache.get(roomId).push(messageToSend);

      // Handle group chat
      if (is_group) {
        console.log("dm: sending group message to room", roomId);

        // Send to all other sockets in the room
        socket.to(roomId).emit("recieve_message", messageToSend);

        // Update each participant’s room list + last message
        const room = await Room.findById(roomId).populate("participants");
        for (const participant of room.participants) {
          const sid = memory.socketIds.get(String(participant._id));
          if (!sid) continue;

          const sortedRooms = await getRoomsWithNames(participant);
          io.to(sid).emit("receive_rooms", sortedRooms);

          const lastMessage = await fetchLastMessage(roomId);
          io.to(sid).emit("recieve_last_message", lastMessage);
        }
      } else {
        // 8. Handle one-to-one chat
        const recipient = await User.findOne({ username: to });
        if (!recipient) {
          console.error("dm: recipient not found", to);
          return;
        }

        const recipientSid = memory.socketIds.get(String(recipient._id));

        // send to recipient if online
        if (recipientSid) {
          io.to(recipientSid).emit("recieve_message", messageToSend);

          const lastMessage = await fetchLastMessage(roomId);
          io.to(recipientSid).emit("recieve_last_message", lastMessage);

          const sortedRoomsRecipient = await getRoomsWithNames(recipient);
          io.to(recipientSid).emit("receive_rooms", sortedRoomsRecipient);
        } else {
          console.log("dm: recipient offline", to);
        }

        // always send back to sender
        socket.emit("recieve_message", messageToSend);

        const lastMessage = await fetchLastMessage(roomId);
        socket.emit("recieve_last_message", lastMessage);

        const sortedRoomsSender = await getRoomsWithNames(sender);
        socket.emit("receive_rooms", sortedRoomsSender);
      }

      // Return via callback
      if (callback) callback(messageToSend);
    } catch (err) {
      console.error("dm error:", err);
      if (callback) callback({ error: "Failed to send message" });
    }
  });

  // Mark a message as read by a user
  socket.on("message_read", async (msgId, roomId, userId) => {
    const user = await User.findById(userId);
    if (!user) return;

    // Atomically update the message's readBy field
    await Room.updateOne(
      { _id: roomId, "messages._id": msgId },
      { $addToSet: { "messages.$.readBy": user._id } }
    );

    // Retrieve the updated message to send back
    const room = await Room.findById(roomId).select("messages").lean();
    const message = room.messages.find((m) => String(m._id) === String(msgId));
    if (!message) return;

    // update cache
    const cachedMessages = memory.messagesCache.get(roomId) || [];
    const cachedMessage = cachedMessages.find((m) => m._id.equals(msgId));
    if (
      cachedMessage &&
      !cachedMessage.readBy.some((id) => String(id) === String(userId))
    ) {
      cachedMessage.readBy.push(userId);
    }

    // Notify the sender and the reader about the read status
    const senderSid = memory.socketIds.get(String(message.sender));
    if (senderSid)
      io.to(senderSid).emit("message_read_update", message, roomId);
    socket.emit("message_read_update", message, roomId);
  });
}

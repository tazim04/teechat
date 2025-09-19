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
    // Find the sender from the database
    const sender = await User.findById(from);
    const message = { sender: sender._id, content, timestamp: new Date() };

    // Initialize cache for room if it doesn't exist
    if (!memory.messagesCache.has(roomId)) memory.messagesCache.set(roomId, []);

    // Save the message to the database
    const savedMessage = await addMessage(roomId, message);

    // Format the message to include sender details for the client
    const formattedMessage = {
      _id: savedMessage._id,
      readBy: savedMessage.readBy,
      sender: { _id: sender._id, username: sender.username },
      content,
      timestamp: new Date(),
    };

    // Update the cache
    memory.messagesCache.get(roomId).push(formattedMessage);

    // Emit the message to the appropriate clients
    if (is_group) {
      socket.to(roomId).emit("recieve_message", formattedMessage);
      const room = await Room.findById(roomId).populate("participants");

      // Notify all participants in the group chat
      for (const p of room.participants) {
        const sid = memory.socketIds.get(String(p._id));
        if (sid) {
          const last = await fetchLastMessage(roomId);
          io.to(sid).emit("recieve_last_message", last);
        }
      }
    } else {
      const recipient = await User.findOne({ username: to });
      const sid = memory.socketIds.get(String(recipient._id));
      if (sid) {
        io.to(sid).emit("recieve_message", formattedMessage);
        const lastMessage = await fetchLastMessage(roomId);
        io.to(sid).emit("recieve_last_message", lastMessage);
      }
      const lastMessage = await fetchLastMessage(roomId);
      socket.emit("recieve_last_message", lastMessage);

      // Update rooms for both sender and recipient
      const sortedRoomsRecipient = await getRoomsWithNames(recipient);
      if (sid) io.to(sid).emit("receive_rooms", sortedRoomsRecipient);

      const sortedRoomsSender = await getRoomsWithNames(sender);
      socket.emit("receive_rooms", sortedRoomsSender);
    }
    callback(formattedMessage);
  });

  // Mark a message as read by a user
  socket.on("message_read", async (msgId, roomId, userId) => {
    const room = await Room.findById(roomId).select("messages");
    if (!room) return;

    const user = await User.findById(userId);
    if (!user) return;

    // Find the specific message in the room
    const message = room.messages.find((m) => m._id.equals(msgId));
    if (!message) return;

    // Update the readBy array if the user hasn't already marked it as read
    if (!message.readBy.some((id) => id.equals(userId))) {
      message.readBy.push(userId);
    }

    // update cache
    const cachedMessages = memory.messagesCache.get(roomId) || [];
    const cached = cachedMessages.find((m) => m._id.equals(msgId));
    if (cached && !cached.readBy.some((id) => id.equals(userId))) {
      cached.readBy.push(userId);
    }

    await room.save();

    // Notify the sender and the reader about the read status
    const senderSid = memory.socketIds.get(String(message.sender));
    if (senderSid)
      io.to(senderSid).emit("message_read_update", message, roomId);
    socket.emit("message_read_update", message, roomId);
  });
}

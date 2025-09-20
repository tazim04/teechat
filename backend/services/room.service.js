import Room from "../models/rooms.js";
import User from "../models/users.js";

// Add a new message to a room and return the newly added message with its ID
export async function addMessage(roomId, message) {
  const room = await Room.findById(roomId);

  const messageData = {
    sender: message.sender,
    content: message.content,
    timestamp: message.timestamp,
  };
  await room.updateOne({ $push: { messages: messageData } });

  const updatedRoom = await Room.findById(roomId).select("messages -_id");

  const updatedMessage = updatedRoom.messages[updatedRoom.messages.length - 1];
  return updatedMessage;
}

// Fetch previous messages for a room, populating sender details
export async function getPreviousMessages(roomId) {
  const room = await Room.findById(roomId)
    .populate({ path: "messages.sender", model: "User", select: "username" })
    .lean();
  let prev_messages = room?.messages ?? [];
  return prev_messages;
}

// Find a direct room between two users
export async function findDirectRoom(senderId, recipientId) {
  return Room.findOne({
    is_group: false,
    participants: { $all: [senderId, recipientId] },
  });
}

// Create a direct room between two users if it doesn't already exist
export async function createDirectRoom(sender, recipient) {
  const existing = await findDirectRoom(sender._id, recipient._id);
  if (existing) {
    console.log(
      "Room already exists between:",
      sender.username,
      recipient.username
    );
    return existing;
  }

  console.log("Creating room between:", sender, recipient);

  const room = await Room.create({
    name: null,
    is_group: false,
    participants: [sender._id, recipient._id],
    messages: [],
  });

  // add room to both users' room lists
  await sender.updateOne({
    $push: {
      rooms: room._id,
    },
  });
  await recipient.updateOne({
    $push: { rooms: room._id },
  });
  return room;
}

// Create a group chat room with multiple participants
export async function createGroupRoom(participants, roomName) {
  // for gc, no need to check if the room already exists

  const ids = participants.map((p) => p._id);

  const room = await Room.create({
    name: roomName,
    is_group: true,
    participants: ids,
    messages: [],
  });

  // add room to all users' room lists
  await User.updateMany(
    { _id: { $in: ids } },
    { $addToSet: { rooms: room._id } }
  );
  return room;
}

// Fetch rooms for a user, if the room is not a group set its name to the other participant's username
export async function getRoomsWithNames(user) {
  const userPopulated = await User.findById(user._id)
    .populate({
      path: "rooms",
      populate: "participants",
    })
    .exec();

  const rooms = userPopulated?.rooms.map((room) => {
    if (room.is_group) {
      room.name = room.name; // Set the room name to the group chat name
    } else {
      room.name = room.participants.find(
        (participant) => participant.username !== user.username
      ).username; // Set the room name to the other participant's username
    }
    return room;
  });

  // Sort rooms by last updated time (most recent first)
  const sortedRooms = rooms.sort((a, b) => b.updatedAt - a.updatedAt);
  return sortedRooms;
}

// Fetch the last message of a room along with sender details
export async function fetchLastMessage(roomId) {
  const room = await Room.findById(roomId).select("messages").lean();

  if (!room || !room.messages?.length) {
    console.log("fetchLastMessage: No messages found for room", roomId);
    return null;
  }

  const last = room.messages[room.messages.length - 1];
  const sender = await User.findById(last.sender);

  return { room_id: roomId, ...last, sender };
}

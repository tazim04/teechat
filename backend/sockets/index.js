import { socketAuth } from "./middleware/auth.js";
import authSocket from "./auth.socket.js";
import usersSocket from "./users.socket.js";
import roomsSocket from "./rooms.socket.js";
import messagesSocket from "./messages.socket.js";
import preferencesSocket from "./preferences.socket.js";

export function registerSocket(io) {
  socketAuth(io);

  io.on("connection", (socket) => {
    console.log("🔌 client:", socket.id);

    // Register socket modules
    authSocket(socket);
    usersSocket(io, socket);
    roomsSocket(io, socket);
    messagesSocket(io, socket);
    preferencesSocket(io, socket);
  });
}

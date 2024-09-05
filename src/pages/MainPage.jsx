import Chat from "./Chat";
import SideBar from "../components/SideBar";
import { useEffect, useState, createContext, useContext } from "react";

import { usePalette } from "../context/PaletteContext";
import { useSocket } from "../context/SocketContext";
import { onlineUsersContext } from "../App";
import { usernameContext } from "../App";

function MainPage() {
  const [room, setRoom] = useState(""); // State for the room
  const [messages, setMessages] = useState([]); // State for the messages

  const { onlineUsers, setOnlineUsers } = useContext(onlineUsersContext); // Get the online users from the context
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { togglePalette } = usePalette(); // Destructure palette from usePalette
  const { username } = useContext(usernameContext); // Get the username from the context

  // Listen for events when the component mounts
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit("join_server", username); // Emit a "join_server" event
      socket.emit("fetch_rooms", username); // Emit a "fetch_rooms" event to get the rooms for the user

      // Listen for events from the server and log them
      socket.onAny((event, ...args) => {
        console.log(event, args);
      });
    }
    return () => {
      if (socket) {
        // Clean up the event listeners
        socket.off("receive_online_users");
        socket.offAny();
      }
    };
  }, [socket, username]);

  return (
    <div className="flex h-screen">
      <SideBar
        username={username}
        room={room}
        setRoom={setRoom}
        messages={messages}
        setMessages={setMessages}
      />
      <Chat
        username={username}
        room={room}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}

export default MainPage;

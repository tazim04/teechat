import Chat from "./Chat";
import SideBar from "../components/SideBar";
import { useEffect, useState, createContext, useContext } from "react";

import { usePalette } from "../context/PaletteContext";
import { useSocket } from "../context/SocketContext";
import { onlineUsersContext } from "../App";
import { userContext } from "../App";

function MainPage() {
  const [currentRoom, setCurrentRoom] = useState(""); // State for the current room
  const [messages, setMessages] = useState({}); // State for the messages

  const { onlineUsers, setOnlineUsers } = useContext(onlineUsersContext); // Get the online users from the context
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { togglePalette } = usePalette(); // Destructure palette from usePalette
  const { user } = useContext(userContext); // Get the user from the context

  // Listen for events when the component mounts
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit("join_server", user); // Emit a "join_server" event

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
  }, [socket, user]);

  return (
    <div className="flex h-screen">
      <SideBar
        currentRoom={currentRoom}
        setCurrentRoom={setCurrentRoom}
        messages={messages}
        setMessages={setMessages}
      />
      <Chat
        currentRoom={currentRoom}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
}

export default MainPage;

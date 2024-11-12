import Chat from "./Chat";
import SideBar from "../components/SideBar";
import { useEffect, useState, createContext, useContext } from "react";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";

import { usePalette } from "../context/PaletteContext";
import { useSocket } from "../context/SocketContext";
import { onlineUsersContext } from "../context/OnlineUsersContext";
import { userContext } from "../context/UserContext";

function MainPage() {
  const [currentRoom, setCurrentRoom] = useState(""); // State for the current room
  const [messages, setMessages] = useState({}); // State for the messages
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // State for screen width

  const { onlineUsers, setOnlineUsers } = useContext(onlineUsersContext); // Get the online users from the context
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { togglePalette } = usePalette(); // Destructure palette from usePalette
  const { user } = useContext(userContext); // Get the user from the context

  // Update screen width state on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const disconnected_notify = () => {
    toast.remove();
    toast.error("Disconnected from server. Please refresh the page.", {
      duration: Infinity,
    });
  };

  // Listen for events when the component mounts
  useEffect(() => {
    if (socket && socket.connected) {
      toast.remove();
      socket.emit("join_server", user); // Emit a "join_server" event
      console.log("user: ", user);
      if (user._id) {
        socket.emit("fetch_palette", user._id); // Emit a "fetch_palette" event
      }

      // Listen for events from the server and log them
      socket.onAny((event, ...args) => {
        console.log(event, args);
      });
    } else if (!socket) {
      disconnected_notify();
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
      {/* <SideBar
        currentRoom={currentRoom}
        setCurrentRoom={setCurrentRoom}
        messages={messages}
        setMessages={setMessages}
      /> */}

      {/* Conditionally render SideBar and Chat based on isMobile and currentRoom */}
      {(!isMobile || !currentRoom) && (
        <SideBar
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          messages={messages}
          setMessages={setMessages}
        />
      )}

      {/* <Chat
        currentRoom={currentRoom}
        setCurrentRoom={setCurrentRoom}
        messages={messages}
        setMessages={setMessages}
      /> */}

      {/* Conditionally render Chat on mobile based on currentRoom */}
      {(!isMobile || currentRoom) && (
        <Chat
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          messages={messages}
          setMessages={setMessages}
          isMobile={isMobile}
        />
      )}
      <Toaster />
    </div>
  );
}

export default MainPage;

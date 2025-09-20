import Chat from "./Chat";
import Menu from "../components/Menu";
import SideBar from "../components/SideBar";
import { useEffect, useState, createContext, useContext } from "react";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";

import { usePalette } from "../context/PaletteContext";
import { useSocket } from "../context/SocketContext";
import { onlineUsersContext } from "../context/OnlineUsersContext";
import { userContext } from "../context/UserContext";
import { isMobileContext } from "../context/IsMobileContext";

function MainPage() {
  const [currentRoom, setCurrentRoom] = useState(""); // State for the current room
  const [messages, setMessages] = useState({}); // State for the messages
  const [showMenu, setShowMenu] = useState(false);
  const [rooms, setRooms] = useState([]);

  const { onlineUsers, setOnlineUsers } = useContext(onlineUsersContext); // Get the online users from the context
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { togglePalette } = usePalette(); // Destructure palette from usePalette
  const { user } = useContext(userContext); // Get the user from the context
  const { isMobile, setIsMobile } = useContext(isMobileContext);

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

  const openChat = (selected_room) => {
    if (currentRoom && currentRoom._id === selected_room._id) {
      return; // If the selected chat is the same as the current chat, return
    }
    // console.log("Opening chat: ", selected_room); // Log the selected chat
    setCurrentRoom(selected_room); // Set the room to the selected chat
    socket.emit("get_previous_messages", selected_room); // Emit a "get_previous_messages" event

    // console.log(
    //   "Set room to: " + selected_room.id,
    //   selected_room.name,
    //   "is_group: " + selected_room.is_group
    // ); // Log the selected chat
  };

  return (
    <div className="md:flex md:h-screen relative">
      <div className={`${isMobile && currentRoom && "hidden"}`}>
        <SideBar
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          messages={messages}
          setMessages={setMessages}
          showMenu={showMenu}
          setShowMenu={setShowMenu} // Pass down menu toggle state
          rooms={rooms}
          setRooms={setRooms}
          openChat={openChat}
        />
      </div>

      {showMenu && (
        <Menu
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          rooms={rooms}
          openChat={openChat}
          // style={{
          //   position: "absolute",
          //   top: "1rem",
          //   left: "calc(20rem + 1rem)", // Adjust based on sidebar width
          //   zIndex: "50",
          // }}
        />
      )}

      {(!isMobile || currentRoom) && (
        <Chat
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          messages={messages}
          setMessages={setMessages}
        />
      )}
      <Toaster />
    </div>
  );
}

export default MainPage;

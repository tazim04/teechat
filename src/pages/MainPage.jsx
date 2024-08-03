import Chat from "./Chat";
import SideBar from "../components/SideBar";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

function MainPage({ username }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [room, setRoom] = useState(""); // State for the room

  // Listen for events when the component mounts
  useEffect(() => {
    if (socket) {
      if (socket.connected) {
        socket.emit("join_server", username); // Emit a "join_server" event
      }

      // Listen for events from the server and log them
      socket.onAny((event, ...args) => {
        console.log(event, args);
      });
    }
  }, [socket, username]);

  return (
    <div className="flex h-screen">
      <SideBar username={username} room={room} setRoom={setRoom} />
      <Chat username={username} room={room} />
    </div>
  );
}

export default MainPage;

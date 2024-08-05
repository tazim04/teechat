import Chat from "./Chat";
import SideBar from "../components/SideBar";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

function MainPage({ username }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [room, setRoom] = useState(""); // State for the room
  const [messages, setMessages] = useState([]); // State for the messages

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

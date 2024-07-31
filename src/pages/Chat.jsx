import { useSocket } from "../context/SocketContext";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import SideBar from "../components/SideBar";
import e from "cors";

function Chat() {
  const socket = useSocket(); // Use the custom hook to get the socket object from the context
  const [message, setMessage] = useState(""); // State for the message

  // Listen for the connection event
  useEffect(() => {
    if (socket) {
      socket.on("connect", () => {
        console.log("Connected to the server");
      });

      return () => {
        socket.off("disconnect");
      };
    }
  }, [socket]);

  const onType = (e) => {
    let message = e.target.value;
    console.log("Typing message...", message);
    setMessage(message); // Update the message state
  };

  const send = () => {
    console.log("Sending message...");
    socket.emit("message", message); // Emit a message
    setMessage(""); // Clear the message input
  };

  return (
    <div className="flex h-screen">
      <SideBar />
      <div className="flex flex-col flex-1">
        <div className="flex-1">{/* chat messages here */}</div>
        <div className="p-4 pb-8 bg-gray-200 flex">
          <input
            type="text"
            placeholder="Write your message!"
            className="w-full h-12 focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-4 bg-white rounded-md py-2"
            value={message}
            onChange={onType}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            className="bg-indigo-500 text-white rounded-md px-8 h-12 ms-5"
            onClick={send}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;

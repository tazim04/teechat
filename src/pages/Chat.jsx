import { useSocket } from "../context/SocketContext";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import SideBar from "../components/SideBar";

function Chat({ username, room }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [message, setMessage] = useState(""); // State for the message
  const [messages, setMessages] = useState([]); // State for the messages
  const [users, setUsers] = useState([]); // State for the users

  // Listen for events when the component mounts
  useEffect(() => {
    if (socket && socket.connected) {
      console.log("Chat component mounted. Socket:", socket);

      // Listen for received messages
      socket.once("recieve_message", (messageData) => {
        console.log("Message received:", messageData); // Log the received message
        let content = messageData.content;
        let sender = messageData.sender;

        let messageContent = {
          content,
          sender,
        };

        setMessages((prevMessages) => {
          return {
            ...prevMessages,
            [sender]: [...(prevMessages[sender] || []), messageContent], // Update the messages state for this dm
          };
        });
        console.log("Messages:", messages);
      });
    }
    return () => {
      socket.off("recieve_message"); // Clean up the event listener
    };
  }, [socket, username, messages]);

  const onType = (e) => {
    let message = e.target.value;
    console.log("Typing message...", message);
    setMessage(message); // Update the message state
  };

  const send = () => {
    if (!message) return; // If the message is empty, do nothing
    console.log(
      "Sending message: " +
        message +
        " to room: " +
        room +
        " from user: " +
        username
    );

    let messageContent = {
      content: message,
      sender: username,
    };
    setMessages((prevMessages) => {
      return {
        ...prevMessages,
        [room.username]: [
          ...(prevMessages[room.username] || []),
          messageContent,
        ], // Update the messages state for this dm
      };
    });
    socket.emit("dm", message, room.id, username); // Emit a message, FOR NOW ROOM IS JUST A USER
    setMessage(""); // Clear the message input
  };

  return (
    <div className="flex flex-col flex-1">
      {room && room.username ? ( // Check if the room (recipient) is selected
        <div className="flex flex-col flex-1">
          <div className="flex-1">
            {/* Check if there are messages for the selected recipient */}
            {messages[room.username] ? (
              messages[room.username].map((msg, index) =>
                // If message from user align right, else align left
                msg.sender === username ? (
                  <div key={index} className="p-4 text-right">
                    <b>
                      <p>{msg.sender}</p>
                    </b>
                    <p>{msg.content}</p>
                  </div>
                ) : (
                  <div key={index} className="p-4 text-left">
                    <b>
                      <p>{msg.sender}</p>
                    </b>
                    <p>{msg.content}</p>
                  </div>
                )
              )
            ) : (
              // If no messages, display a message
              <p>No messages in this conversation</p>
            )}
          </div>
          <div className="p-4 pb-8 bg-gray-200 flex">
            <input
              type="text"
              placeholder={`Message ${room.username}`}
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
      ) : (
        <div className="justify-center">
          <h1>Welcome to Tazim's Chatting app!</h1>
        </div>
      )}
    </div>
  );
}

export default Chat;

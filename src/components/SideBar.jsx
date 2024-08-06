import "./stylesheets/SideBar.css";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { io } from "socket.io-client";

function SideBar({ username, room, setRoom, messages, setMessages }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [contacts, setContacts] = useState([]); // State for the chats (FOR NOW GETS ALL USERS IN THE SERVER)

  // Socket.io event listeners
  useEffect(() => {
    if (socket && socket.connected) {
      console.log("SideBar component mounted. Socket:", socket);

      // Listen for the updated user list
      socket.on("update_contacts", (users) => {
        setContacts(users); // Update the chats state
        console.log("Users list updated:", users); // Log the updated user list
      });
    }
    return () => {
      if (socket) {
        // Clean up the event listeners
        socket.off("update_contacts");
      }
    };
  }, [socket]);

  const openChat = (contacts) => {
    if (room && room.id === contacts.id) {
      return; // If the selected chat is the same as the current chat, return
    }
    setRoom(contacts); // Set the room to the selected chat
    socket.emit("get_previous_messages", contacts.id); // Emit a "get_previous_messages" event

    console.log(
      "Set room to: " + contacts.id,
      contacts.name,
      "is_group: " + contacts.is_group
    ); // Log the selected chat
  };

  return (
    <div
      className="sidebar flex h-screen bg-indigo-500"
      style={{ width: "20rem" }}
    >
      <div className="side-bar-body w-full">
        <div className="flex items-center ps-5 h-20 border-b-4">
          <h1 className="title text-lg font-bold">Chats</h1>
        </div>
        <div className="chats flex flex-col flex-1 text-base mt-5">
          {contacts.map((contact, index) => (
            // Display the list of users in the server (excluding the current user)
            <div
              className="chat-room flex py-3"
              key={index}
              onClick={() => openChat(contact)}
            >
              {contact.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SideBar;

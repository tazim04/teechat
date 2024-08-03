import "./stylesheets/SideBar.css";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { io } from "socket.io-client";

function SideBar({ username, room, setRoom }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [chats, setChats] = useState([]); // State for the chats (FOR NOW GETS ALL USERS IN THE SERVER)

  useEffect(() => {
    if (socket && socket.connected) {
      console.log("SideBar component mounted. Socket:", socket);

      // Listen for the updated user list
      socket.on("update_user_list", (users) => {
        setChats(users); // Update the chats state
        console.log("Users list updated:", users); // Log the updated user list
      });
    }
  }, [socket]);

  const openChat = (chat) => {
    setRoom(chat); // Set the room to the selected chat, FOR NOW USER ID
    console.log("Set room to: " + chat.username);
  };

  return (
    <div className="flex h-screen w-1/6 bg-indigo-500">
      <div className="side-bar-body w-full">
        <div className="flex items-center ps-5 h-20 border-b-4">
          <h1 className="title text-lg font-bold">Chats</h1>
        </div>
        <div className="chats flex flex-col flex-1 text-base mt-5">
          {chats.map((chat, index) =>
            // Display the list of users in the server (excluding the current user)
            chat.username !== username ? (
              <div
                className="chat-room flex py-3"
                key={index}
                onClick={() => openChat(chat)}
              >
                {chat.username}
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

export default SideBar;

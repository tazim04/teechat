import "./stylesheets/SideBar.css";
import { useEffect, useRef, useState, useContext } from "react";
import { useSocket } from "../context/SocketContext";
import { io } from "socket.io-client";
import { onlineUsersContext } from "../App";
import AvatarIcon from "./AvatarIcon";

function SideBar({ username, room, setRoom, messages, setMessages }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [rooms, setRooms] = useState([]); // State for the rooms
  const [addFriendsOpen, setAddFriendsOpen] = useState(false); // State for the add friends modal

  const { onlineUsers, setOnlineUsers } = useContext(onlineUsersContext); // Get the online users from the context

  // Socket.io event listeners
  useEffect(() => {
    if (socket) {
      // Listen for the updated user list
      socket.on("receive_rooms", (rooms) => {
        setRooms(rooms); // Update the rooms state
      });

      socket.on("receive_online_users", (users) => {
        setOnlineUsers(users); // Update the online users state
      });

      // Emit a "fetch_online_users" event to get list of online users
      socket.emit("fetch_online_users");
    }

    return () => {
      if (socket) {
        // Clean up the event listeners
        socket.off("receive_rooms");
        socket.off("receive_online_users");
      }
    };
  }, [socket, setOnlineUsers]);
  const openChat = (rooms) => {
    if (room && room.id === rooms.id) {
      return; // If the selected chat is the same as the current chat, return
    }
    setRoom(rooms); // Set the room to the selected chat
    socket.emit("get_previous_messages", rooms.id); // Emit a "get_previous_messages" event

    console.log(
      "Set room to: " + rooms.id,
      rooms.name,
      "is_group: " + rooms.is_group
    ); // Log the selected chat
  };

  const checkOnline = (contact) => {
    // Check if the contact is online
    const user = onlineUsers.find((user) => user === contact.name); // Find the contact in the online users list
    return user ? true : false;
  };

  return (
    <div
      className="sidebar flex h-screen text-white bg-gradient-to-br from-indigo-700 to-purple-700 to-70%"
      style={{ width: "20rem" }}
    >
      <div className="side-bar-body w-full">
        <div className="flex items-center ps-5 h-20 mb-5">
          <h1 className="title text-lg font-bold">Chats</h1>
        </div>
        <div className="flex flex-col flex-1 text-base">
          {rooms.length > 0 ? (
            rooms.map((room, index) => (
              // Display the list of users in the server (excluding the current user)
              <div
                className="flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer hover:bg-purple-600"
                style={{ width: "95%" }}
                key={index}
                onClick={() => openChat(room)}
              >
                <AvatarIcon username={room.name} />
                <div
                  className=""
                  style={{ position: "absolute", left: "58px", top: "135px" }}
                >
                  {checkOnline(room) ? (
                    <span className="flex w-2.5 h-2.5 bg-green-400 rounded-full me-1.5 flex-shrink-0"></span>
                  ) : (
                    <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full me-1.5 flex-shrink-0"></span>
                  )}
                </div>
                {room.name}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h5 className="font-bold text-gray-200">No friends :(</h5>
              <div
                className={`h-10 w-10 mt-5 rounded-ful transition-all duration-100 ease-in-out bg-[url('./add_icon.png')] hover:bg-[url('./add_icon_active.png')] bg-contain bg-no-repeat
                  ${addFriendsOpen ? "rotate-45" : ""}
                  `}
                onClick={() => setAddFriendsOpen(!addFriendsOpen)}
              ></div>
            </div>
          )}
        </div>
        <div
          className={`bg-indigo-400 w-72 h-80 mx-auto mt-3 rounded-xl transition-opacity duration-75 ease-in-out shadow-2xl ${
            addFriendsOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className=" flex justify-center pt-5">
            <h5 className="font-bold" style={{ fontSize: "1rem" }}>
              Add Friends
            </h5>
          </div>
          <div className="px-auto text-base">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((user, index) => (
                // Display the list of users in the server (excluding the current user)
                <div
                  className="flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer hover:bg-purple-600"
                  style={{ width: "95%" }}
                  key={index}
                  onClick={() => {
                    setRoom({
                      id: user,
                      name: user,
                      is_group: false,
                    });
                  }}
                >
                  <AvatarIcon username={user} />
                  <div
                    className=""
                    style={{
                      position: "absolute",
                      left: "58px",
                      top: "135px",
                    }}
                  >
                    {checkOnline({ name: user }) ? (
                      <span className="flex w-2.5 h-2.5 bg-green-400 rounded-full me-1.5 flex-shrink-0"></span>
                    ) : (
                      <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full me-1.5 flex-shrink-0"></span>
                    )}
                  </div>
                  {user}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <h5 className="font-bold text-gray-200">blah</h5>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SideBar;

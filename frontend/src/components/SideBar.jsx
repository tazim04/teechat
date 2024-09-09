import "./stylesheets/SideBar.css";
import { useEffect, useRef, useState, useContext } from "react";
import { io } from "socket.io-client";
import AvatarIcon from "./AvatarIcon";
import { Squash as Hamburger } from "hamburger-react";
import Menu from "./Menu";
import CreateRoom from "./menu/CreateRoom";
import { usernameContext } from "../App";
import RoomCard from "./RoomCard";
import { Tooltip } from "react-tooltip";
import "./stylesheets/SideBar.css";

// context imports
import { onlineUsersContext } from "../App";
import { allUsersContext } from "../App";
import { usePalette } from "../context/PaletteContext";
import { useSocket } from "../context/SocketContext";

function SideBar({ room, setRoom, messages, setMessages }) {
  const [rooms, setRooms] = useState([]); // State for the rooms
  const [createRoomOpen, setCreateRoomOpen] = useState(false); // State for the add friends modal
  // const [hoveredUser, setHoveredUser] = useState(null); // State for hovering over the add friend button
  const [showMenu, setShowMenu] = useState(false); // State for the menu
  const [showToolTip, setShowToolTip] = useState(false); // State for the tooltip

  // states from context
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { palette } = usePalette(); // Destructure palette from usePalette
  const { onlineUsers, setOnlineUsers } = useContext(onlineUsersContext); // State holding online users
  const { allUsers, setAllUsers } = useContext(allUsersContext); // State holding all users in the database
  const { username } = useContext(usernameContext); // Get the username from the context

  // Socket.io event listeners
  useEffect(() => {
    if (socket) {
      // Listen for the updated user list
      socket.on("receive_rooms", (rooms) => {
        console.log("Received rooms: ", rooms);
        setRooms(rooms); // Update the rooms state
      });

      socket.on("receive_online_users", (users) => {
        setOnlineUsers(users); // Update the online users state
      });

      socket.on("receive_all_users", (users) => {
        setAllUsers(users); // Update the all users state
      });

      // Emit a "fetch_online_users" event to get list of online users
      socket.emit("fetch_online_users");

      // Emit a "fetch_all_users" event to get list of all users in the database
      socket.emit("fetch_all_users");
    }

    return () => {
      if (socket) {
        // Clean up the event listeners
        socket.off("receive_rooms");
        socket.off("receive_online_users");
        socket.off("receive_all_users");
      }
    };
  }, [socket, setOnlineUsers, rooms]);

  useEffect(() => {
    if (rooms.length > 0) {
      setShowToolTip(false); // Hide the tooltip if there are rooms
    } else {
      setShowToolTip(true); // Show the tooltip if there are no rooms
    }
  }, [rooms]);

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
    console.log("Checking online: ", contact);
    console.log("Online users: ", onlineUsers);

    // Check if the contact's name is included in the onlineUsers array
    const isOnline = onlineUsers.includes(contact.name);

    console.log(`Is ${contact.name} online: `, isOnline);
    return isOnline;
  };

  return (
    <div className="flex flex-row">
      <div
        className={`flex h-screen transition-color ease-in-out duration-300 ${palette.sideBar}`}
        style={{ width: "20rem" }}
      >
        <div className="side-bar-body w-full">
          <div className="flex items-center justify-between ps-5 h-20 mb-5">
            <h1 className="title text-lg font-bold">Chats</h1>
            <div className="flex ml-auto pe-3">
              <div
                className={`transition-color duration-75 ease-in-out ${
                  palette.sideBarHover
                } rounded-xl ${showMenu ? `${palette.menu}` : ""}`}
                data-tooltip-id="first-room"
                data-tooltip-content="Create your first room here!"
                onMouseEnter={() => setShowToolTip(false)}
              >
                <Hamburger
                  size={25}
                  color="#fff"
                  toggled={showMenu}
                  toggle={setShowMenu}
                />
              </div>
            </div>
          </div>

          <Tooltip
            id="first-room"
            style={{
              fontSize: "0.6rem",
              borderRadius: "1rem",
            }}
            isOpen={showToolTip}
          />

          <div className="flex flex-col flex-1 text-base">
            {rooms.length > 0 ? (
              rooms.map((room, index) => (
                <div key={index}>
                  <RoomCard
                    room={room}
                    openChat={openChat}
                    checkOnline={checkOnline}
                  />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full mb-4 relative">
                <h5 className="font-bold text-gray-200">No rooms :(</h5>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      {showMenu && (
        <Menu
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          createRoomOpen={createRoomOpen}
          username={username}
          rooms={rooms}
          openChat={openChat}
        />
      )}
    </div>
  );
}

export default SideBar;

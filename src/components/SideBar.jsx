import "./stylesheets/SideBar.css";
import { useEffect, useRef, useState, useContext } from "react";
import { useSocket } from "../context/SocketContext";
import { io } from "socket.io-client";
import { onlineUsersContext } from "../App";
import AvatarIcon from "./AvatarIcon";
import { Squash as Hamburger } from "hamburger-react";
import Menu from "./Menu";

function SideBar({ username, room, setRoom, messages, setMessages }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [rooms, setRooms] = useState([]); // State for the rooms
  const [addFriendsOpen, setAddFriendsOpen] = useState(false); // State for the add friends modal
  const [allUsers, setAllUsers] = useState([]); // State for all users
  const [hoveredUser, setHoveredUser] = useState(null); // State for hovering over the add friend button
  const [showMenu, setShowMenu] = useState(false); // State for the menu

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

      socket.on("receive_all_users", (users) => {
        setAllUsers(users);
        console.log("All users: ", users);
      });

      // Emit a "fetch_online_users" event to get list of online users
      socket.emit("fetch_online_users");

      socket.emit("fetch_all_users");
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

  const addFriend = (user) => {
    console.log("Add friend: ", user);
  };

  return (
    <div className="flex flex-row">
      <div
        className="sidebar flex h-screen text-white bg-gradient-to-br from-indigo-700 to-purple-700 to-70%"
        style={{ width: "20rem" }}
      >
        <div className="side-bar-body w-full">
          <div className="flex items-center justify-between ps-5 h-20 mb-5">
            <h1 className="title text-lg font-bold">Chats</h1>
            <div className="flex ml-auto pe-3">
              <div
                className={`transition-colors duration-75 ease-in-out hover:bg-purple-600 rounded-xl ${
                  showMenu ? "bg-indigo-500" : ""
                }`}
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

          <div className="flex flex-col flex-1 text-base">
            {rooms.length > 0 ? (
              rooms.map((room, index) => (
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
              {allUsers.length > 0 ? (
                allUsers
                  .filter((user) => user !== username) // Filter out the current user
                  .map((user, index) => (
                    <div>
                      <div
                        className="flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer hover:bg-purple-600"
                        style={{ width: "95%" }}
                        key={index}
                        onClick={() => {
                          addFriend(user);
                        }}
                        onMouseEnter={() => setHoveredUser(user)}
                        onMouseLeave={() => setHoveredUser(null)}
                      >
                        <AvatarIcon username={user} />
                        {user}
                        {hoveredUser === user && (
                          <div className="text-md text-gray-200 ml-auto">
                            Send Invite
                          </div>
                        )}
                      </div>
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
      {showMenu && <Menu showMenu={showMenu} />}
    </div>
  );
}

export default SideBar;

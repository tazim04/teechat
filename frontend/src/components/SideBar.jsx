import { useEffect, useRef, useState, useContext, createContext } from "react";
import { io } from "socket.io-client";
import { Squash as Hamburger } from "hamburger-react";
import Menu from "./Menu";
import CreateRoom from "./menu/CreateRoom";
import RoomCard from "./RoomCard";
import { Tooltip } from "react-tooltip";

// context imports
import { onlineUsersContext } from "../context/OnlineUsersContext";
import { allUsersContext } from "../context/AllUsersContext";
import { usePalette } from "../context/PaletteContext";
import { useSocket } from "../context/SocketContext";
import { userContext } from "../context/UserContext";

// Create a context object for isDeleteOpen state for delete confirmation modal
export const isDeleteOpenContext = createContext(false);

function SideBar({ currentRoom, setCurrentRoom, messages, setMessages }) {
  // const [hoveredUser, setHoveredUser] = useState(null); // State for hovering over the add friend button
  const [showMenu, setShowMenu] = useState(false); // State for the menu
  const [showToolTip, setShowToolTip] = useState(false); // State for the tooltip
  const [isDeleteOpen, setIsDeleteOpen] = useState(false); // State for the delete confirmation modal
  const [selectedRoomContext, setSelectedRoomContext] = useState(""); // State for the selected room for the context menu
  const [search, setSearch] = useState("");

  // states from context
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { palette } = usePalette(); // Destructure palette from usePalette
  const { onlineUsers, setOnlineUsers } = useContext(onlineUsersContext); // State holding online users
  const { allUsers, setAllUsers } = useContext(allUsersContext); // State holding all users in the database
  const { user } = useContext(userContext); // Get the user from the context

  const username = user.username; // Get the username from the context
  const [rooms, setRooms] = useState([]); // State for the rooms

  // Socket.io event listeners
  useEffect(() => {
    if (socket) {
      // Listen for the updated user list
      socket.on("receive_rooms", (rooms) => {
        // console.log("Received rooms: ", rooms);
        setRooms(rooms); // Update the rooms state
      });

      socket.on("recieve_updated_room", (room) => {
        setRooms((prevRooms) =>
          prevRooms.map((prevRoom) =>
            prevRoom._id === room._id ? room : prevRoom
          )
        );
        setCurrentRoom(room);
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

      // Emit a "fetch_rooms" event to get the list of rooms
      socket.emit("fetch_rooms", username);
    }

    return () => {
      if (socket) {
        // Clean up the event listeners
        socket.off("receive_rooms");
        socket.off("receive_online_users");
        socket.off("receive_all_users");
      }
    };
  }, [socket, username]);

  useEffect(() => {
    if (rooms.length > 0) {
      setShowToolTip(false); // Hide the tooltip if there are rooms
    } else {
      setShowToolTip(true); // Show the tooltip if there are no rooms
    }
  }, [rooms]);

  // useEffect(() => {
  //   const filteredRooms = rooms.filter((user) =>
  //     user.username.toLowerCase().includes(search.toLowerCase())
  //   );
  //   console.log("filteredUsers:", filteredUsers);

  //   setUsersToShow(filteredUsers);
  // }, [search]);

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

  const checkOnline = (room) => {
    // console.log("Checking online: ", room);
    // console.log("Online users: ", onlineUsers);

    // Check if the room's name is included in the onlineUsers array
    const isOnline = onlineUsers.includes(getOtherParticipantId(room));

    // console.log(`Is ${room.name} online: `, isOnline);
    return isOnline;
  };

  const getOtherParticipantId = (room) => {
    const participants = room.participants;
    const otherParticipant = participants.find(
      (participant) => participant._id !== user._id
    );
    // console.log("Other participant:", otherParticipant);
    return otherParticipant._id;
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value); // update search state
    console.log("Search:", e.target.value);
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden md:w-[20rem] w-[100vw]">
      <div
        className={`flex transition-color ease-in-out duration-300 ${palette.sideBar}`}
        // style={{ width: "20rem" }}
      >
        <div className="side-bar-body w-full h-full">
          {" "}
          {/* Add h-full here */}
          <div className="flex items-center justify-between ps-5 h-20 mb-2">
            {/* "Rooms" header */}
            <h1 className="title text-lg font-bold">Rooms</h1>
            <div className="flex ml-auto pe-3">
              {/* Hamburger main menu */}
              <div
                className="transition-color duration-75 ease-in-out hover:bg-opacity-40 hover:bg-gray-300 rounded-xl"
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
              fontSize: "1rem",
              borderRadius: "1rem",
              zIndex: "9999",
            }}
            place="right"
            isOpen={showToolTip}
          />
          {/* Search bar */}
          <div className="flex justify-center px-5 mb-2 text-gray-950 font-semibold">
            <input
              type="text"
              placeholder="Search"
              className="text-[0.9rem] rounded-md px-3 py-1 w-full outline-none"
              onChange={handleSearchChange}
            />
          </div>
          {/* Rooms list */}
          <div className="col text-base overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-300 scrollbar-track-transparent h-[calc(100vh-6.2rem)] pb-20">
            <isDeleteOpenContext.Provider
              value={{ isDeleteOpen, setIsDeleteOpen }}
            >
              {rooms.length > 0 ? (
                rooms
                  .filter((room) =>
                    room.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((room, index) => (
                    <div key={index}>
                      <RoomCard
                        room={room}
                        openChat={openChat}
                        checkOnline={checkOnline}
                        selectedRoomContext={selectedRoomContext}
                        setSelectedRoomContext={setSelectedRoomContext}
                        currentRoom={currentRoom}
                        setCurrentRoom={setCurrentRoom}
                      />
                    </div>
                  ))
              ) : (
                <div className="flex justify-center align-middle items-center">
                  <h5 className="font-bold text-gray-200">No rooms :(</h5>
                </div>
              )}
            </isDeleteOpenContext.Provider>
          </div>
        </div>
      </div>

      {/* Menu */}
      {showMenu && (
        <Menu
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          rooms={rooms}
          openChat={openChat}
        />
      )}
    </div>
  );
}

export default SideBar;

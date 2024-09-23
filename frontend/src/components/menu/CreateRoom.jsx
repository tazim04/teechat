import { useState, useContext, useEffect } from "react";
import AvatarIcon from "../AvatarIcon";

// context imports
import { useSocket } from "../../context/SocketContext";
import { allUsersContext } from "../../context/AllUsersContext";
import { userContext } from "../../context/UserContext";
import { usePalette } from "../../context/PaletteContext";
import { set } from "mongoose";

function CreateRoom({
  rooms,
  openChat,
  setShowMenu,
  menuHeight,
  setMenuHeight,
}) {
  const [hoveredUser, setHoveredUser] = useState(null); // State for hovering over the add friend button
  const [selectedCreateRoom, setSelectedCreateRoom] = useState(null); // State to check if a room was selected for creation
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
  const [groupChat, setGroupChat] = useState(false); // State for group chat visibility
  const [showCreateRoomBTN, setShowCreateRoomBTN] = useState(false);
  const [groupChatName, setGroupChatName] = useState("");

  const { allUsers } = useContext(allUsersContext); // Get the all users from the context
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { user } = useContext(userContext); // Get the user from the context
  const { palette } = usePalette(); // Destructure palette from usePalette

  const [selectedUsers, setSelectedUsers] = useState([
    { _id: user._id, username: user.username },
  ]); // State for selected users for groupchat creation

  const username = user.username; // Get the username from the context

  const onTypeGroupChatName = (e) => {
    setGroupChatName(e.target.value);
    console.log("Group chat name: ", groupChatName);
  };

  // Track the group chat name input and show the create room button
  useEffect(() => {
    if (groupChatName.length > 0) {
      setShowCreateRoomBTN(true);
    } else {
      setShowCreateRoomBTN(false);
    }
  }, [groupChatName]);

  useEffect(() => {
    if (groupChat && selectedUsers.length > 1) {
      setMenuHeight(31);
    } else {
      setMenuHeight(25); // Default menu height
    }
  }, [selectedUsers, groupChat]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const toggleGroupChat = (isGroupChat) => {
    setGroupChat(isGroupChat);
    closeDropdown();
  };

  const addToGroup = (selected_user) => {
    if (selectedUsers.includes(selected_user)) {
      console.log("Remove from group: ", selected_user);
      setSelectedUsers(
        selectedUsers.filter((selectedUser) => selectedUser !== selected_user)
      ); // Remove the user from the selected users array
    } else {
      console.log("Add to group: ", selected_user);
      setSelectedUsers([...selectedUsers, selected_user]); // Add the user to the selected users array
      console.log("Selected users: ", selectedUsers);
    }
  };

  // Create a room with a user, {_id, username}
  const createRoom = (selected_user) => {
    const existingRoom =
      rooms && rooms.find((room) => room.name === selected_user._id); // Check if the room already exists, name is the username of the user selected

    if (existingRoom) {
      // If the room exists, open it
      console.log("Room already exists with: ", selected_user);
      setShowMenu(false); // Close the add friend modal
      openChat(existingRoom); // Set the room to the existing chat
    } else {
      // If the room does not exist, create a new one
      setSelectedCreateRoom(selected_user); // Set the selected room for creation
      socket.emit("create_room", user, selected_user); // Emit a "create_room" event with the selected user
      console.log("Create room with: ", selected_user);

      setShowMenu(false); // Close the add friend modal
    }
  };

  // Create a room with multiple users
  const createRoom_gc = () => {
    const existingRoom =
      rooms && rooms.find((room) => room.name === groupChatName);

    if (existingRoom) {
      console.log("Room already exists with: ", groupChatName);
      setShowMenu(false); // Close the add friend modal
      openChat(existingRoom); // Set the room to the existing chat
    } else {
      console.log(`Creating room ${groupChatName} with users: `, selectedUsers);
      socket.emit("create_room_gc", selectedUsers, groupChatName); // Emit "create_room_gc" event
    }
  };

  return (
    <div
      className={`text-gray-200 ${palette.menu} w-full h-[19rem] mx-auto shadow-lg `}
    >
      <div className="flex justify-center p-5 relative">
        <h5 className="font-bold inline" style={{ fontSize: "1rem" }}>
          Create a room with{" "}
          <span
            className="underline transition-all duration-150 p-1 rounded-md bg-opacity-30 bg-gray-300 hover:bg-opacity-50 text-gray-100 hover:text-white shadow-sm hover:shadow-md cursor-pointer relative"
            onClick={toggleDropdown}
          >
            {groupChat ? "multiple people" : "someone"}
            {/* Dropdown container */}
            {isDropdownOpen && (
              <ul className="absolute left-1/2 transform -translate-x-1/2 bg-gray-100 bg-opacity-15 rounded-lg z-[1] w-36 p-1 shadow mt-1">
                <li
                  className={`${
                    palette.createRoomHover
                  } rounded-md p-2 text-center ${
                    groupChat ? "" : palette.dropdownSelected
                  }`}
                  onClick={() => {
                    toggleGroupChat(false);
                  }}
                >
                  someone
                </li>
                <li
                  className={`${
                    palette.createRoomHover
                  } rounded-md p-2 text-center ${
                    groupChat ? palette.dropdownSelected : ""
                  }`}
                  onClick={() => {
                    toggleGroupChat(true);
                  }}
                >
                  multiple people
                </li>
              </ul>
            )}
          </span>
          .
        </h5>
      </div>
      <div className="px-auto text-base h-[15rem] pb-1 overflow-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-slate-700 scrollbar-track-slate-300">
        {allUsers.length > 0 ? (
          allUsers
            .filter((user) => user.username !== username) // Filter out the current user
            .map((user, index) => (
              <div key={index}>
                <div
                  className={`flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer ${palette.createRoomHover}
                  `}
                  style={{ width: "95%" }}
                  onClick={() => {
                    groupChat ? addToGroup(user) : createRoom(user);
                  }}
                  onMouseEnter={() => setHoveredUser(user._id)}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  <div className="w-10 h-10 me-5">
                    <AvatarIcon
                      name={user.username}
                      showStatus={false}
                      isOnline={false}
                    />
                  </div>
                  {user.username}
                  {groupChat ? (
                    <span
                      className={`ml-auto p-2 rounded-full bg-gray-100 transition-all duration-100 ${
                        selectedUsers.includes(user)
                          ? "bg-opacity-100"
                          : "bg-opacity-30"
                      } `}
                    ></span>
                  ) : (
                    hoveredUser === user._id &&
                    (rooms &&
                    rooms.find((room) => room.name === user.username) ? (
                      <div className="text-md ml-auto">Existing Chat</div>
                    ) : (
                      <div className="text-md ml-auto">
                        Create Room
                        {selectedCreateRoom === user && (
                          <div className="text-md ml-auto">
                            Creating Room...
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <h5 className="font-bold">blah</h5>
          </div>
        )}
      </div>

      {/* Group Chat name and finalization */}
      <div
        className={`absolute top-[-11rem] w-full flex justify-center transition-all ease-in-out duration-300 ${
          menuHeight > 25 ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          transform: `translateY(${menuHeight}rem) ${
            showCreateRoomBTN ? "translateX(-3rem)" : ""
          }`,
        }}
      >
        <div className="relative">
          <h5 className="text-gray-50 text-center pb-2">
            Give your room a name
          </h5>
          <input
            type="text"
            className="bg-gray-100 text-gray-900 text-md rounded px-4 py-2"
            placeholder="eg: Amazing Monkeys"
            value={groupChatName}
            onChange={onTypeGroupChatName}
          />
        </div>
      </div>

      <div
        className={`absolute bottom-[6.8rem] right-5 transition-opacity ease-in-out ${
          showCreateRoomBTN && groupChat
            ? "opacity-100 delay-300 duration-300"
            : "opacity-0"
        }`}
      >
        <button
          className="bg-purple-500 hover:bg-purple-600 px-2 py-2 rounded-md text-md text-gray-50"
          onClick={createRoom_gc}
        >
          Create room
        </button>
      </div>
    </div>
  );
}

export default CreateRoom;

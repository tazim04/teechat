import { useState, useContext, useEffect, useCallback } from "react";
import AvatarIcon from "../AvatarIcon";
import toast, { Toaster } from "react-hot-toast";

// context imports
import { useSocket } from "../../context/SocketContext";
import { allUsersContext } from "../../context/AllUsersContext";
import { userContext } from "../../context/UserContext";
import { usePalette } from "../../context/PaletteContext";

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
  const [search, setSearch] = useState("");

  const { allUsers } = useContext(allUsersContext); // Get the all users from the context
  const [usersToShow, setUsersToShow] = useState(allUsers); // state for dispaying users based on search filter

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

  const handleSearchChange = (e) => {
    setSearch(e.target.value); // update search state
    console.log("Search:", e.target.value);
  };

  useEffect(() => {
    const filteredUsers = allUsers.filter((user) =>
      user.username.toLowerCase().includes(search.toLowerCase())
    );
    console.log("filteredUsers:", filteredUsers);

    setUsersToShow(filteredUsers);
  }, [search]);

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
      setMenuHeight(33);
    } else {
      setMenuHeight(27); // Default menu height
      setShowCreateRoomBTN(false);
      setGroupChatName("");
    }
  }, [selectedUsers, groupChat]);

  const handleRoomCreated = useCallback(
    (wasSuccessful, recipient) => {
      console.log('Received "room_created" event:', wasSuccessful, recipient);
      toast.dismiss(); // Clear any toasts

      if (wasSuccessful) {
        toast.success(`Created room with ${recipient}!`);
      } else {
        toast.error(
          `There was a problem! Couldn't create the room with ${recipient}!`
        );
      }
    },
    [] // No dependencies
  );

  const handleGroupRoomCreated = useCallback(
    (wasSuccessful, groupChatName) => {
      console.log(
        'Received "group_room_created" event:',
        wasSuccessful,
        groupChatName
      );
      toast.dismiss(); // Clear any toasts

      if (wasSuccessful) {
        toast.success(`Created group room: ${groupChatName}!`);
      } else {
        toast.error(
          `There was a problem creating the group room: ${groupChatName}!`
        );
      }
    },
    [] // No dependencies
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("room_created", handleRoomCreated);
    socket.on("group_room_created", handleGroupRoomCreated);

    return () => {
      socket.off("room_created", handleRoomCreated);
      socket.off("group_room_created", handleGroupRoomCreated);
    };
  }, [socket, handleRoomCreated, handleGroupRoomCreated]);

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
    // if (selectedUsers.includes(selected_user)) {
    //   // console.log("Remove from group: ", selected_user);
    //   setSelectedUsers(
    //     selectedUsers.filter((selectedUser) => selectedUser !== selected_user)
    //   ); // Remove the user from the selected users array
    // } else {
    console.log("Add to group: ", selected_user);
    setSelectedUsers([...selectedUsers, selected_user]); // Add the user to the selected users array
    console.log("Selected users: ", selectedUsers);
    // }
  };

  const removeFromGroup = (selected_user) => {
    setSelectedUsers(
      selectedUsers.filter((selectedUser) => selectedUser !== selected_user)
    ); // Remove the user from the selected users array
  };

  // Create a room with a user, {_id, username}
  const createRoom = (selected_user) => {
    const roomName = selected_user.username;
    const existingRoom = rooms && rooms.find((room) => room.name === roomName); // Check if the room already exists, name is the username of the user selected

    if (existingRoom) {
      // If the room exists, open it
      console.log("Room already exists with: ", selected_user);
      setShowMenu(false); // Close the add friend modal
      openChat(existingRoom); // Set the room to the existing chat
    } else {
      // If the room does not exist, create a new one
      setSelectedCreateRoom(selected_user); // Set the selected room for creation
      socket.emit("create_room", user, selected_user); // Emit a "create_room" event with the selected user
      // console.log("Create room with: ", selected_user);

      toast.loading("Creating room...");

      setShowMenu(false); // Close the add friend modal
    }
  };

  // Create a room with multiple users
  const createRoom_gc = () => {
    const existingRoom =
      rooms && rooms.find((room) => room.name === groupChatName);

    if (existingRoom) {
      console.log("Room already exists with: ", groupChatName);
      setShowMenu(false); // Close modal
      openChat(existingRoom); // Set the room to the existing chat
    } else {
      console.log(`Creating room ${groupChatName} with users: `, selectedUsers);
      socket.emit("create_room_gc", selectedUsers, groupChatName); // Emit "create_room_gc" event

      toast.loading("Creating room...");

      setShowMenu(false); // Close modal
    }
  };

  return (
    <>
      <Toaster />

      {/* Display users that are selected for group room */}
      {selectedUsers.filter((user) => user.username != username).length > 0 &&
        groupChat && (
          <div
            className={`absolute left-80 ms-1 p-4 ${palette.menu} rounded-md text-gray-100 min-w-60 w-auto max-w-96 whitespace-nowrap flex flex-col items-center`}
          >
            <div className="mb-1 w-full flex items-center text-ellipsis">
              <h4 className="text-[1rem] font-semibold truncate">
                Roommates in{" "}
                <span className="underline ml-1 " title={groupChatName}>
                  {groupChatName.trim() ? groupChatName : "\u00A0\u00A0\u00A0"}
                </span>
              </h4>
            </div>
            <div className="bg-gray-200 bg-opacity-20 rounded-lg w-full">
              {/* Show list of selected users */}
              {selectedUsers
                .filter((user) => user.username != username)
                .map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between align-middle px-3 py-1"
                  >
                    <span
                      className="truncate flex-1 mr-2"
                      title={user.username}
                    >
                      {user.username}
                    </span>
                    <div
                      className="hover:opacity-50 transition-opacity ease-in-out p-1 cursor-pointer"
                      onClick={() => removeFromGroup(user)}
                    >
                      <img
                        src="/close.png" // Replace with the correct path or URL
                        alt="Remove"
                        className="w-3 invert "
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      <div
        className={`text-gray-200 ${palette.menu} w-full h-[21rem] mx-auto shadow-lg `}
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
                <ul className="absolute left-1/2 transform -translate-x-1/2 bg-gray-100 bg-opacity-80 rounded-lg z-[1] w-36 p-1 shadow mt-1">
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
        <div className="flex justify-center px-5 mb-2 text-gray-950 font-semibold">
          <input
            type="text"
            placeholder="Search"
            className="text-[0.9rem] rounded-md px-3 py-1 w-full outline-none"
            onChange={handleSearchChange}
          />
        </div>
        <div className="px-auto text-base h-[14.5rem] pb-1 overflow-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {usersToShow.length > 0 ? (
            usersToShow
              .filter((user) => user.username !== username) // Filter out the current user
              .map((user) => (
                <div key={user._id}>
                  <div
                    className={`flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer relative whitespace-nowrap text-ellipsis ${palette.createRoomHover}
                  `}
                    style={{ width: "95%" }}
                    onClick={() => {
                      if (groupChat) {
                        selectedUsers.some((u) => u._id === user._id) // the user is already in the group of selected uers, remove from group
                          ? removeFromGroup(user)
                          : addToGroup(user);
                      } else {
                        createRoom(user);
                      }
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

                    {/* Username */}
                    <div
                      className="flex-1 text-[1.1rem] truncate"
                      title={user.username}
                    >
                      {user.username}
                    </div>

                    {/* Conditional Rendering */}
                    {!groupChat && hoveredUser === user._id && (
                      <span className="ml-auto pointer-events-none text-sm ps-1 transition-opacity duration-300">
                        Create Room
                        {selectedCreateRoom === user && (
                          <div className="text-sm">Creating Room...</div>
                        )}
                      </span>
                    )}
                    {groupChat && (
                      <span
                        className={`ml-auto p-2 rounded-full bg-gray-100 transition-all duration-100 ${
                          selectedUsers.some(({ _id }) => _id === user._id)
                            ? "bg-opacity-100"
                            : "bg-opacity-30"
                        } `}
                      ></span>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center my-16 mx-10">
              <p className="font-bold text-[1rem]">
                There are no users with a matching name! :(
              </p>
            </div>
          )}
        </div>

        {/* Group Chat name and finalization */}
        <div
          className={`absolute top-[-11rem] w-full flex justify-center transition-all ease-in-out duration-300 ${
            menuHeight > 27 ? "opacity-100" : "opacity-0 pointer-events-none"
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
          {showCreateRoomBTN && (
            <button
              className="bg-purple-500 hover:bg-purple-600 px-2 py-2 rounded-md text-md text-gray-50"
              onClick={createRoom_gc}
              disabled={!showCreateRoomBTN || !groupChat}
            >
              Create room
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default CreateRoom;

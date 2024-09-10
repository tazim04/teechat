import { useState, useContext } from "react";
import AvatarIcon from "../AvatarIcon";

// context imports
import { useSocket } from "../../context/SocketContext";
import { allUsersContext } from "../../App";
import { userContext } from "../../App";
import { usePalette } from "../../context/PaletteContext";

function CreateRoom({ rooms, openChat, setShowMenu }) {
  const [hoveredUser, setHoveredUser] = useState(null); // State for hovering over the add friend button
  const [selectedCreateRoom, setSelectedCreateRoom] = useState(null); // State to check if a room was selected for creation
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
  const [groupChat, setGroupChat] = useState(false); // State for group chat visibility
  const [selectedUsers, setSelectedUsers] = useState([]); // State for selected users for groupchat creation

  const { allUsers } = useContext(allUsersContext); // Get the all users from the context
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { user } = useContext(userContext); // Get the user from the context
  const { palette } = usePalette(); // Destructure palette from usePalette

  const username = user.username; // Get the username from the context

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

  const addToGroup = (user) => {
    if (selectedUsers.includes(user)) {
      console.log("Remove from group: ", user);
      setSelectedUsers(
        selectedUsers.filter((selectedUser) => selectedUser !== user)
      ); // Remove the user from the selected users array
    } else {
      console.log("Add to group: ", user);
      setSelectedUsers([...selectedUsers, user]); // Add the user to the selected users array
      console.log("Selected users: ", selectedUsers);
    }
  };

  const createRoom = (user) => {
    const existingRoom = rooms && rooms.find((room) => room.name === user);

    if (existingRoom) {
      // If the room exists, open it
      console.log("Room already exists with: ", user);
      setShowMenu(false); // Close the add friend modal
      openChat(existingRoom); // Set the room to the existing chat
    } else {
      // If the room does not exist, create a new one
      setSelectedCreateRoom(user); // Set the selected room for creation
      socket.emit("create_room", username, user); // Emit a "create_room" event with the selected user
      console.log("Create room with: ", user);

      setShowMenu(false); // Close the add friend modal
    }
  };

  return (
    <div className="text-gray-200 w-full h-80 mx-auto rounded-xl shadow-2xl ">
      <div className="flex justify-center p-5 relative">
        <h5 className="font-bold inline" style={{ fontSize: "1rem" }}>
          Create a room with{" "}
          <span
            className="underline transition-all duration-150 text-gray-100 hover:text-white shadow-sm hover:shadow-md cursor-pointer relative"
            onClick={toggleDropdown}
          >
            {groupChat ? "multiple people" : "someone"}
            {/* Dropdown container */}
            {isDropdownOpen && (
              <ul className="absolute left-1/2 transform -translate-x-1/2 bg-gray-100 bg-opacity-15 rounded-lg z-[1] w-36 p-1 shadow mt-1">
                <li
                  className="hover:bg-purple-600 rounded-md p-2 text-center"
                  onClick={() => {
                    toggleGroupChat(false);
                  }}
                >
                  someone
                </li>
                <li
                  className="hover:bg-purple-600 rounded-md text-center"
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
            .filter((user) => user !== username) // Filter out the current user
            .map((user, index) => (
              <div key={index}>
                <div
                  className={`flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer ${palette.createRoomHover}`}
                  style={{ width: "95%" }}
                  onClick={() => {
                    groupChat ? addToGroup(user) : createRoom(user);
                  }}
                  onMouseEnter={() => setHoveredUser(user)}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  <AvatarIcon username={user} />
                  {user}
                  {groupChat ? (
                    <span
                      className={`ml-auto p-2 rounded-full bg-gray-100 bg-opacity-50 transition-all duration-100 ${
                        selectedUsers.includes(user) && "bg-opacity-100"
                      } `}
                    ></span>
                  ) : (
                    hoveredUser === user &&
                    (rooms && rooms.find((room) => room.name === user) ? (
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
    </div>
  );
}

export default CreateRoom;

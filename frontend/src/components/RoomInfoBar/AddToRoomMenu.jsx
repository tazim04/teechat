import { useState, useContext, useEffect } from "react";
import AvatarIcon from "../AvatarIcon";
import { userContext } from "../../context/UserContext";
import { useSocket } from "../../context/SocketContext";
import { usePalette } from "../../context/PaletteContext";
import { allUsersContext } from "../../context/AllUsersContext";

function AddToRoomMenu({ room, participants, setShowAddParticipant }) {
  const { user } = useContext(userContext);
  const socket = useSocket();
  const { palette } = usePalette();
  const { allUsers } = useContext(allUsersContext);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [hoveredUser, setHoveredUser] = useState(null);
  const [search, setSearch] = useState("");

  // Use this list of users
  const allOtherUsers = allUsers.filter(
    (userItem) =>
      !participants.some((participant) => participant._id === userItem._id) // Filter out users already in room
  );

  const [usersToShow, setUsersToShow] = useState(allOtherUsers); // state for dispaying users based on search filter

  const addToRoom = (selectedUser) => {
    if (socket) {
      socket.emit("add_user_to_room", room._id, selectedUser._id);
      setShowAddParticipant(false); // Close the menu
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value); // update search state
    console.log("Search:", e.target.value);
  };

  useEffect(() => {
    const filteredUsers = allOtherUsers.filter((user) =>
      user.username.toLowerCase().includes(search.toLowerCase())
    );
    console.log("filteredUsers:", filteredUsers);

    setUsersToShow(filteredUsers);
  }, [search]);

  return (
    <div
      className={`text-gray-200 w-60 h-[19rem] shadow-md p-4 rounded-md ${palette.menu} absolute top-0 right-5 z-50 opacity-80 transition-opacity ease-in-out duration-300 hover:opacity-[0.95]`}
    >
      <h3 className="text-[1rem] font-semibold mb-3 text-center">
        Add Users to Room
      </h3>
      <div className="flex justify-center mb-2 text-gray-950 font-semibold">
        <input
          type="text"
          placeholder="Search"
          className="text-[0.9rem] rounded-md px-3 py-1 w-full outline-none"
          onChange={handleSearchChange}
        />
      </div>
      <ul className="h-[13rem] space-y-2 overflow-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {usersToShow.length > 0 ? (
          usersToShow.map((userItem) => (
            <li
              key={userItem._id}
              className={`relative user-item flex items-center cursor-pointer transition ease-in-out p-2 rounded-md ${palette.createRoomHover}`}
              onClick={() => addToRoom(userItem)}
              onMouseEnter={() => setHoveredUser(userItem._id)}
              onMouseLeave={() => setHoveredUser(null)}
            >
              <div className="w-10 h-10 me-2">
                <AvatarIcon
                  name={userItem.username}
                  showStatus={false}
                  isOnline={false}
                />
              </div>
              {userItem.username}
              {hoveredUser === userItem._id && (
                <span className="text-sm absolute right-4 my-auto">
                  Add to room?
                </span>
              )}
            </li>
          ))
        ) : (
          <div className="text-center my-10 mx-8">
            <p className="font-semibold text-[1rem]">
              There are no users with a matching username! <br />
              :(
            </p>
          </div>
        )}
      </ul>
    </div>
  );
}

export default AddToRoomMenu;

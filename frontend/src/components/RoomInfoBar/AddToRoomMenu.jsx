import { useState, useContext } from "react";
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

  // Use this list of users
  const allOtherUsers = allUsers.filter(
    (userItem) =>
      !participants.some((participant) => participant._id === userItem._id) // Filter out users already in room
  );

  const addToRoom = (selectedUser) => {
    if (socket) {
      socket.emit("add_user_to_room", room._id, selectedUser._id);
      setShowAddParticipant(false); // Close the menu
    }
  };

  return (
    <div
      className={`text-gray-200 w-full h-[19rem] shadow-md p-4 rounded-md ${palette.menu}`}
    >
      <h3 className="text-[1rem] font-semibold mb-3 text-center">
        Add Users to Room
      </h3>
      <ul className="user-list space-y-2">
        {allOtherUsers.map((userItem) => (
          <li
            key={userItem.id}
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
        ))}
      </ul>
    </div>
  );
}

export default AddToRoomMenu;

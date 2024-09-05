import { useState, useContext } from "react";
import AvatarIcon from "../AvatarIcon";

// context imports
import { useSocket } from "../../context/SocketContext";
import { allUsersContext } from "../../App";
import { usernameContext } from "../../App";
import { usePalette } from "../../context/PaletteContext";

function CreateRoom({ rooms, openChat, setShowMenu }) {
  const [hoveredUser, setHoveredUser] = useState(null); // State for hovering over the add friend button
  const [selectedCreateRoom, setSelectedCreateRoom] = useState(null); // State to check if a room was selected for creation

  const { allUsers } = useContext(allUsersContext); // Get the all users from the context
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { username } = useContext(usernameContext); // Get the username from the context
  const { palette } = usePalette(); // Destructure palette from usePalette

  const createRoom = (user) => {
    if (rooms && rooms.find((room) => room.name === user)) {
      // Check if the room already exists
      console.log("Room already exists with: ", user);
      setShowMenu(false); // Close the add friend modal
      openChat(rooms.find((room) => room.name === user)); // Set the room to the existing chat
    } else {
      // If the room does not exist, create a new room
      setSelectedCreateRoom(user); // Set the selected room for creation
      socket.emit("create_room", username, user); // Emit a "create_room" event with the selected user
      console.log("Create room with: ", user);

      setShowMenu(false); // Close the add friend modal
      openChat(rooms.find((room) => room.name === user)); // Set the room to the new chat
    }
  };

  return (
    <div className="text-gray-200 w-72 h-80 mx-auto rounded-xl shadow-2xl">
      <div className="flex justify-center p-5">
        <h5 className="font-bold " style={{ fontSize: "1rem" }}>
          Create a room with someone.
        </h5>
      </div>
      <div className="px-auto text-base">
        {allUsers.length > 0 ? (
          allUsers
            .filter((user) => user !== username) // Filter out the current user
            .map((user, index) => (
              <div key={index}>
                <div
                  className={`flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer ${palette.createRoomHover}`}
                  style={{ width: "95%" }}
                  onClick={() => {
                    createRoom(user);
                  }}
                  onMouseEnter={() => setHoveredUser(user)}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  <AvatarIcon username={user} />
                  {user}
                  {hoveredUser === user &&
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
                    ))}
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

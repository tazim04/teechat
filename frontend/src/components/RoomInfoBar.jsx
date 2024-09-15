import { useState, useContext, useEffect } from "react";
import AvatarIcon from "./AvatarIcon";
import { onlineUsersContext } from "../App";
import { useSocket } from "../context/SocketContext";
import { set } from "mongoose";
import { Tooltip } from "react-tooltip";

function RoomInfoBar({ room, showRoomInfo, setShowRoomInfo }) {
  const { onlineUsers } = useContext(onlineUsersContext);
  const socket = useSocket();

  const [participants, setParticipants] = useState([]);
  const [addParticipantHover, setAddParticipantHover] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);

  const checkOnline = (room) => {
    console.log("Checking online: ", room);
    console.log("Online users: ", onlineUsers);

    // Check if the room's name is included in the onlineUsers array
    const isOnline = onlineUsers.includes(room.name);

    console.log(`Is ${room.name} online: `, isOnline);
    return isOnline;
  };

  const addParticipantClick = () => {
    console.log("Add participant clicked");
    setShowAddParticipant(!showAddParticipant); // Toggle the showAddParticipant state
  };

  useEffect(() => {
    if (socket) {
      if (room.is_group) {
        socket.emit("fetch_room_participants", room.id);
      }

      socket.on("receive_room_participants", (participants) => {
        console.log("Participants: ", participants);
        setParticipants(participants);
      });
    }
  }, [room]);

  return (
    <div className="relative w-[18rem] bg-gray-100 border-2 border-l-gray-200 h-full shadow-lg transition-transform duration-300">
      <button
        className="fixed top-3 right-3 text-[1.4rem] flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 
      bg-gray-400 bg-opacity-0 hover:bg-opacity-30 active:bg-opacity-100"
        onClick={() => setShowRoomInfo(false)}
      >
        &times;
      </button>
      <div className="flex flex-col items-center h-full p-4">
        <div className="ms-3 mt-16 h-20 w-20">
          <AvatarIcon
            name={room.name}
            showStatus={false}
            isOnline={checkOnline(room)}
          />
        </div>
        <div className="flex justify-center">
          <h2 className="text-lg text-center font-bold">{room.name}</h2>
        </div>
        <div className="mt-10 ml-3 flex flex-col w-full">
          {room.is_group ? (
            <div>
              <p className="font-medium text-[1rem] mb-3">
                Roommates - {participants.length}
              </p>
              {participants.map((participant, index) => (
                <div key={index} className="flex flex-row mb-3">
                  <div className="w-10 h-10 me-5">
                    <AvatarIcon
                      name={participant.username}
                      showStatus={false}
                      isOnline={checkOnline({ name: participant })}
                    />
                  </div>
                  <p className="text-[1.1rem] font-medium my-auto text-gray-900">
                    {participant.username}
                  </p>
                </div>
              ))}

              <div className="flex justify-center">
                <div
                  className="inline-flex mt-4 cursor-pointer transition-transform duration-200"
                  onClick={addParticipantClick}
                  onMouseEnter={() => setAddParticipantHover(true)}
                  onMouseLeave={() => setAddParticipantHover(false)}
                  data-tooltip-id="add-participant"
                  data-tooltip-content="Add a participant to the room"
                >
                  <img
                    src="/add_icon.png"
                    alt="add"
                    className={`w-7 transition-transform duration-300 
                      invert hover:invert-[50%] ${
                        showAddParticipant ? "rotate-45" : "rotate-0"
                      }
                  `}
                  />
                </div>
              </div>
            </div>
          ) : (
            // add more details for users on account creation (birthday, gender, social media link, etc)
            <div></div>
          )}
        </div>
      </div>
      {!showAddParticipant && (
        <Tooltip
          id="add-participant"
          style={{
            fontSize: "0.8rem",
            borderRadius: "0.7rem",
            zIndex: "9999",
          }}
          place="bottom"
        />
      )}
    </div>
  );
}

export default RoomInfoBar;

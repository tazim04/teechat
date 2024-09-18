import { useState, useContext, useEffect } from "react";
import AvatarIcon from "./AvatarIcon";
import { onlineUsersContext } from "../App";
import { useSocket } from "../context/SocketContext";
import { userContext } from "../App";
import { set } from "mongoose";
import { Tooltip } from "react-tooltip";
import ProfilePopout from "./ProfilePopout";
import { format, isToday } from "date-fns";

function RoomInfoBar({ room, showRoomInfo, setShowRoomInfo }) {
  const { onlineUsers } = useContext(onlineUsersContext);
  const socket = useSocket();
  const { user } = useContext(userContext); // Get the user info from the context

  const [participants, setParticipants] = useState([]);
  const [addParticipantHover, setAddParticipantHover] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);

  const checkOnline = (participant) => {
    // console.log("Checking online: ", participant);
    // console.log("Online users: ", onlineUsers);

    // Check if the room's name is included in the onlineUsers array
    const isOnline = onlineUsers.includes(participant.username);

    // console.log(`Is ${participant.username} online: `, isOnline);
    return isOnline;
  };

  const formatBirthday = (birthday) => {
    const date = new Date(birthday);

    return format(date, "MMMM d, yyyy");
  };

  const toggleProfileClick = (participant) => {
    if (activeProfile === null) {
      setActiveProfile(participant._id);
    } else {
      setActiveProfile(
        participant._id === activeProfile ? null : participant._id
      );
    }
    console.log("Active profile: ", activeProfile);
  };

  const addParticipantClick = () => {
    console.log("Add participant clicked");
    setShowAddParticipant(!showAddParticipant); // Toggle the showAddParticipant state
  };

  useEffect(() => {
    if (socket) {
      if (room.is_group) {
        socket.emit("fetch_room_participants", room.id);
      } else {
        socket.emit("fetch_user", user._id, room.id);
      }

      socket.on("receive_room_participants", (participants) => {
        // console.log("Participants: ", participants);
        setParticipants(participants);
      });
      socket.on("receive_user", (user) => {
        // console.log("User: ", user);
        setParticipants([user]);
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
          <AvatarIcon name={room.name} showStatus={false} isOnline={false} />
        </div>
        <div className="flex justify-center">
          <h2 className="text-lg text-center font-bold">{room.name}</h2>
        </div>
        <div className="mt-10 ml-1 flex flex-col w-full">
          {room.is_group ? (
            <div>
              <p className="font-medium text-[1rem] mb-3">
                Roommates - {participants.length}
              </p>
              {participants.map((participant, index) => (
                <div key={index} className="relative">
                  <div
                    onClick={() => toggleProfileClick(participant)}
                    className={`flex flex-row p-2 rounded-lg cursor-pointer ${
                      participant.username === user.username
                        ? "bg-gray-200 bg-opacity-50"
                        : ""
                    } transition-all ease-in-out duration-100 hover:bg-gray-300`}
                    data-tooltip-id="profile"
                    data-tooltip-html={`
                  <div class='flex flex-col items-center'>
                  <p>Username: ${participant.username}</p>
                  </div>
                    `}
                  >
                    <div className="w-10 h-10 me-5">
                      <AvatarIcon
                        name={participant.username}
                        showStatus={true}
                        isOnline={checkOnline(participant)}
                      />
                    </div>
                    <p className="text-[1.1rem] font-medium my-auto text-gray-700 select-none">
                      {participant.username}
                      {/* {console.log("Participant: ", participant, "User: ", user)} */}
                      <span className="text-[0.8rem] ml-20 text-gray-600">
                        {participant.username === user.username ? "me" : ""}
                      </span>
                    </p>
                  </div>

                  {activeProfile === participant._id && (
                    <ProfilePopout
                      participant={participant}
                      setActiveProfile={setActiveProfile}
                      isOnline={checkOnline(participant)}
                    />
                  )}
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
            <div>
              <p>{participants[0]?.useranme}</p>
            </div>
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

import { useState, useContext, useEffect } from "react";
import AvatarIcon from "../AvatarIcon";
import { useSocket } from "../../context/SocketContext";
import { userContext } from "../../context/UserContext";
import { onlineUsersContext } from "../../context/OnlineUsersContext";
import { set } from "mongoose";
import { Tooltip } from "react-tooltip";
import ProfilePopout from "./ProfilePopout";
import { format, isToday } from "date-fns";
import AddToRoomMenu from "./AddToRoomMenu";

function RoomInfoBar({
  room,
  showRoomInfo,
  setShowRoomInfo,
  participants,
  isOnline, // only for one on one rooms
}) {
  const socket = useSocket();
  const { user } = useContext(userContext); // Get the user info from the context
  const { onlineUsers } = useContext(onlineUsersContext);

  const [addParticipantHover, setAddParticipantHover] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);

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

  const checkOnline = (participant_id) => {
    return onlineUsers.includes(participant_id);
  };

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
          <AvatarIcon name={room.name} showStatus={false} />
          {!room.is_group && (
            <div className="relative left-[3rem] bottom-[0.9rem]">
              {isOnline ? (
                <span className="flex w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></span>
              ) : (
                <span className="flex w-3 h-3 bg-gray-400 rounded-full flex-shrink-0"></span>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <h2 className="text-lg text-center font-bold">{room.name}</h2>
        </div>

        {/* Participants List */}
        <div className="ml-1 flex flex-col w-full">
          {room.is_group ? (
            <div className="mt-10">
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
                    } transition-all ease-in-out duration-100 hover:bg-gray-300 $`}
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
                        showStatus={false}
                        isOnline={checkOnline(participant._id)}
                      />
                      <div className="relative left-[2rem] bottom-[0.9rem]">
                        {isOnline ? (
                          <span className="flex w-2.5 h-2.5 bg-green-400 rounded-full flex-shrink-0"></span>
                        ) : (
                          <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
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
                      room={room}
                      setActiveProfile={setActiveProfile}
                      isOnline={isOnline}
                    />
                  )}
                </div>
              ))}

              {/* Add to room stuff */}
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
              <div className="mt-5">
                {showAddParticipant && (
                  <AddToRoomMenu
                    room={room}
                    participants={participants}
                    setShowAddParticipant={setShowAddParticipant}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <link
                rel="stylesheet"
                href="https://cdn.materialdesignicons.com/6.5.95/css/materialdesignicons.min.css"
              ></link>
              <div className="flex flex-col items-center">
                {(() => {
                  // Function to get the other participant
                  const participant = participants.find(
                    (p) => p.username !== user.username
                  ); // Get the other participant
                  return participant ? (
                    <>
                      <div>
                        <p className="text-gray-500 text-[1rem]">
                          {participant.email}
                        </p>
                      </div>

                      {/* Social Media Links */}
                      <div className="flex flex-row mb-2 mt-1">
                        {participant.socials?.instagram && (
                          <a
                            href={participant.socials.instagram}
                            class="flex rounded-full hover:bg-orange-50 h-10 w-10"
                          >
                            <i class="mdi mdi-instagram text-orange-400 mx-auto mt-2"></i>
                          </a>
                        )}
                        {participant.socials?.facebook && (
                          <a
                            href={participant.socials.facebook}
                            class="flex rounded-full hover:bg-blue-50 h-10 w-10"
                          >
                            <i class="mdi mdi-facebook text-blue-400 mx-auto mt-2"></i>
                          </a>
                        )}
                        {participant.socials?.linkedin && (
                          <a
                            href={participant.socials.linkedin}
                            class="flex rounded-full hover:bg-indigo-50 h-10 w-10"
                          >
                            <i class="mdi mdi-linkedin text-indigo-400 mx-auto mt-2"></i>
                          </a>
                        )}
                      </div>

                      <div className="grid grid-rows-2 p-1 text-center">
                        <div className="row my-4">
                          <p className="font-semibold text-[1rem] text-gray-800 py-1">
                            My Interests
                          </p>
                          <div className="w-full max-w-96 flex flex-wrap justify-center">
                            {participant.interests.map((interest, index) => (
                              <span
                                key={index}
                                className="bg-gray-300 rounded-full px-2 py-1 m-1 text-gray-700 text-[0.8rem]"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="row my-5">
                          <p className="font-semibold text-[1rem] text-gray-800">
                            My Birthday
                          </p>
                          <p className="text-gray-600 text-[0.9rem]">
                            {formatBirthday(participant.birthday)}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    "User not found"
                  ); // Return null if no participant is found
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      {!showAddParticipant && (
        <Tooltip
          id="add-participant"
          style={{
            fontSize: "0.8rem",
            borderRadius: "0.3rem",
            zIndex: "9999",
          }}
          place="bottom"
        />
      )}
    </div>
  );
}

export default RoomInfoBar;

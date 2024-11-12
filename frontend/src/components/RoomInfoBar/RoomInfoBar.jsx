import { useState, useContext, useEffect, useRef } from "react";
import AvatarIcon from "../AvatarIcon";
import { useSocket } from "../../context/SocketContext";
import { userContext } from "../../context/UserContext";
import { onlineUsersContext } from "../../context/OnlineUsersContext";
import { set } from "mongoose";
import { Tooltip } from "react-tooltip";
import ProfilePopout from "./ProfilePopout";
import { format, isToday } from "date-fns";
import AddToRoomMenu from "./AddToRoomMenu";
import toast, { Toaster } from "react-hot-toast";

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
  const [showChangeName, setShowChangename] = useState(false);
  const [newName, setNewName] = useState(room.name); // set as original name initially

  const changeNameInputRef = useRef(null);

  useEffect(() => {
    if (showChangeName && changeNameInputRef.current) {
      changeNameInputRef.current.focus(); // focus on the change name input when the user clicks change name
    }
  }, [showChangeName]);

  const onNewNameType = (e) => {
    console.log("onNewNameType:", e.target.value);
    setNewName(e.target.value);
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
    // console.log("Active profile: ", activeProfile);
  };

  const addParticipantClick = () => {
    // console.log("Add participant clicked");
    setShowAddParticipant(!showAddParticipant); // Toggle the showAddParticipant state
  };

  const checkOnline = (participant_id) => {
    return onlineUsers.includes(participant_id);
  };

  const handleChangeNameClick = () => {
    console.log("Change name!", room.name);
    setShowChangename(true);
  };

  const handleChangeNameSubmit = () => {
    if (newName === room.name) {
      toast("Room name unchanged!");
      return;
    } else if (!newName) {
      toast("Can't have an empty room name!");
      return;
    }
    {
      setShowChangename(false);
      const prevName = room.name;
      toast(
        <div>
          <b>{prevName}</b> changed to: <b>{newName}</b>
        </div>
      );
      console.log("Changing room name to:", newName);
      socket.emit("change_room_name", newName, room._id);
    }
  };

  const cancelChangeName = () => {
    setShowChangename(false);
    setNewName(room.name);
  };

  return (
    <div className="relative md:w-[18rem] w-[100vw] bg-gray-100 border-2 border-l-gray-200 h-full shadow-lg transition-transform duration-300">
      <Toaster />
      <button
        className="fixed top-3 right-3 text-[1.4rem] flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 
      bg-gray-400 bg-opacity-0 hover:bg-opacity-30 active:bg-opacity-100"
        onClick={() => setShowRoomInfo(false)}
      >
        &times;
      </button>

      {/* Avatar Icon */}
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
          {room.is_group &&
            (showChangeName ? ( // change room name menu
              <div>
                <div className="flex flex-row">
                  <textarea
                    className="text-lg text-center font-bold w-64 rounded-md placeholder-gray-400 focus:underline bg-gray-100 outline-none resize-none overflow-hidden"
                    defaultValue={room.name}
                    placeholder="Ex: Crazy Monkeys"
                    ref={changeNameInputRef}
                    onChange={onNewNameType}
                  />
                </div>
                <div className="flex justify-center mt-3 space-x-2">
                  <button
                    className="bg-green-500 px-2 py-1 text-white rounded-lg hover:bg-green-400"
                    onClick={handleChangeNameSubmit}
                  >
                    Change Name
                  </button>
                  <button
                    className="bg-red-500 px-2 py-1 text-white rounded-lg hover:bg-red-400"
                    onClick={cancelChangeName}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-row">
                <h2 className="text-lg text-center font-bold truncate w-60">
                  {room.name}
                </h2>

                <span
                  className="ms-1 flex items-center opacity-100 transition-all duratin-100 ease-in-out hover:opacity-50 cursor-pointer"
                  onClick={handleChangeNameClick}
                >
                  <img src="/rename_room.png" alt="rename" className="w-5" />
                </span>
              </div>
            ))}
          {!room.is_group && (
            <h2 className="text-lg text-center font-bold truncate w-60">
              {room.name}
            </h2>
          )}
        </div>

        {/* Participants List */}
        <div className="ml-1 flex flex-col w-full">
          {room.is_group ? (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-[1rem]">
                  Roommates - {participants.length}
                </p>
                <div className="flex items-center align-middle">
                  {/* Add to room stuff */}
                  <div>
                    <div
                      className="cursor-pointer transition-transform duration-200 ms-28"
                      onClick={addParticipantClick}
                      onMouseEnter={() => setAddParticipantHover(true)}
                      onMouseLeave={() => setAddParticipantHover(false)}
                      data-tooltip-id="add-participant"
                      data-tooltip-content="Add a participant to the room"
                    >
                      <img
                        src="/add_icon.png"
                        alt="add"
                        className={`w-5 transition-transform duration-300 
                      invert hover:invert-[50%] ${
                        showAddParticipant ? "rotate-45" : "rotate-0"
                      }
                  `}
                      />
                    </div>
                  </div>
                  <div className="mt-5 relative">
                    {showAddParticipant && (
                      <AddToRoomMenu
                        room={room}
                        participants={participants}
                        setShowAddParticipant={setShowAddParticipant}
                      />
                    )}
                  </div>
                </div>
              </div>
              {participants.map((participant, index) => (
                <div key={index} className="relative my-1">
                  <div
                    onClick={() => toggleProfileClick(participant)}
                    className={`flex flex-row p-2 rounded-lg cursor-pointer ${
                      participant.username === user.username
                        ? "bg-gray-200 bg-opacity-50"
                        : ""
                    } transition-all ease-in-out duration-100 hover:bg-gray-300 $`}
                    data-tooltip-id="profile"
                    //   data-tooltip-html={`
                    // <div className='flex flex-col items-center'>
                    // <p>Username: ${participant.username}</p>
                    // </div>
                    //   `}
                  >
                    <div className="flex align-middle">
                      <div className="w-10 h-10">
                        <AvatarIcon
                          name={participant.username}
                          showStatus={false}
                          isOnline={checkOnline(participant._id)}
                        />
                      </div>

                      <div className="relative right-[0.6rem] top-7">
                        {checkOnline(participant._id) ? (
                          <span className="flex w-2.5 h-2.5 bg-green-400 rounded-full flex-shrink-0"></span>
                        ) : (
                          <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                    </div>
                    <p className="text-[1.1rem] ms-3 font-medium my-auto text-gray-700 select-none truncate max-w-full">
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
                            className="flex rounded-full hover:bg-orange-50 h-10 w-10"
                          >
                            <i className="mdi mdi-instagram text-orange-400 mx-auto mt-2"></i>
                          </a>
                        )}
                        {participant.socials?.facebook && (
                          <a
                            href={participant.socials.facebook}
                            className="flex rounded-full hover:bg-blue-50 h-10 w-10"
                          >
                            <i className="mdi mdi-facebook text-blue-400 mx-auto mt-2"></i>
                          </a>
                        )}
                        {participant.socials?.linkedin && (
                          <a
                            href={participant.socials.linkedin}
                            className="flex rounded-full hover:bg-indigo-50 h-10 w-10"
                          >
                            <i className="mdi mdi-linkedin text-indigo-400 mx-auto mt-2"></i>
                          </a>
                        )}
                      </div>

                      <div className="grid grid-rows-2 p-1 text-center">
                        <div className="row my-4">
                          <p className="font-semibold text-[1rem] text-gray-800 py-1">
                            My Interests
                          </p>
                          <div className="w-full max-w-96 flex flex-wrap justify-center max-h-[8.7rem] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-300 scrollbar-track-transparent">
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
          place="left"
        />
      )}
    </div>
  );
}

export default RoomInfoBar;

import { onlineUsersContext } from "../context/OnlineUsersContext";
import { useContext, useState } from "react";
import { usePalette } from "../context/PaletteContext";
import AvatarIcon from "./AvatarIcon";

function ChatBar({ room, showRoomInfo, setShowRoomInfo, isOnline }) {
  const { palette } = usePalette(); // Destructure palette from usePalette

  const roomInfoClick = () => {
    // Function to handle the room info click
    console.log("Room info clicked:", room); // Log the room info
    setShowRoomInfo(!showRoomInfo); // Set the showRoomInfo state to true
  };

  return (
    <div
      className={`bg-gray-50 md:h-20 h-[12dvh] border-b-2 shadow-sm border-b-gray-200`}
    >
      <div className="flex relative">
        <img
          src={`https://ui-avatars.com/api/?name=${room.name}&background=random&color=fff`}
          alt="avatar"
          className="rounded-full w-auto h-14 my-3 mx-6 shadow-sm"
        />
        <div className="my-auto">
          <h4>{room.name}</h4>
          {!room.is_group && (
            <span className="flex items-center text-sm font-medium text-gray-900">
              {isOnline ? (
                <span className="flex w-2.5 h-2.5 bg-green-500 rounded-full me-1.5 flex-shrink-0"></span>
              ) : (
                <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full me-1.5 flex-shrink-0"></span>
              )}
              {isOnline ? "Online" : "Offline"}
            </span>
          )}
        </div>
        <div
          className="absolute right-6 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-300 
          bg-gray-500 bg-opacity-0 hover:bg-opacity-30 active:bg-opacity-80"
          onClick={roomInfoClick}
        >
          {
            // Add a conditional statement to check if the room is a group
            showRoomInfo ? (
              <img
                src="/room_info_active.png"
                alt="info"
                className="h-5 2xl:h-7"
              />
            ) : (
              <img src="/room_info.png" alt="info" className="h-5 2xl:h-7" />
            )
          }
        </div>
      </div>
    </div>
  );
}

export default ChatBar;

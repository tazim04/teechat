import { onlineUsersContext } from "../App";
import { useContext, useState } from "react";
import { usePalette } from "../context/PaletteContext";

function ChatBar({ room, showRoomInfo, setShowRoomInfo }) {
  const { onlineUsers } = useContext(onlineUsersContext); // Get the online users from the context
  const { palette } = usePalette(); // Destructure palette from usePalette

  const checkOnline = (contact) => {
    // Check if the contact is online
    const user = onlineUsers.find((user) => user === contact.name); // Find the contact in the online users list
    return user ? true : false;
  };

  const roomInfoClick = () => {
    // Function to handle the room info click
    console.log("Room info clicked:", room); // Log the room info
    setShowRoomInfo(true); // Set the showRoomInfo state to true
  };

  return (
    <div className={`bg-gray-50 h-20 border-b-2 shadow-sm border-b-gray-200`}>
      <div className="flex relative">
        <img
          src={`https://ui-avatars.com/api/?name=${room.name}&background=random&color=fff`}
          alt="avatar"
          className="rounded-full w-auto h-14 my-3 mx-6"
        />
        <div className="my-auto">
          <h4>{room.name}</h4>
          {!room.is_group && (
            <span className="flex items-center text-sm font-medium text-gray-900">
              {checkOnline(room) ? (
                <span className="flex w-2.5 h-2.5 bg-green-500 rounded-full me-1.5 flex-shrink-0"></span>
              ) : (
                <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full me-1.5 flex-shrink-0"></span>
              )}
              {checkOnline(room) ? "Online" : "Offline"}
            </span>
          )}
        </div>
        {!showRoomInfo && (
          <div
            className="absolute right-6 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-300 
          bg-gray-500 bg-opacity-0 hover:bg-opacity-30 active:bg-opacity-80"
            onClick={roomInfoClick}
          >
            <img src="/dots.png" alt="info" className="h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatBar;

import { useState } from "react";

function RoomInfoBar({ room, showRoomInfo, setShowRoomInfo }) {
  return (
    <div className="relative w-96 bg-gray-200 h-full shadow-lg transition-transform duration-300">
      <div className="absolute top-5 left-5">
        <button
          onClick={() => setShowRoomInfo(false)} // Close button
          className="text-gray-500 hover:text-gray-800 p-3 rounded-full transition-all duration-300 
          bg-gray-500 bg-opacity-0 hover:bg-opacity-30 active:bg-opacity-80"
        >
          <img src="/close.png" alt="close" className="h-5" />
        </button>
      </div>
      <div className="flex flex-col h-full p-4">
        <div className="flex justify-center mt-10">
          <h2 className="text-lg font-bold">{room.name}</h2>
        </div>
        <p className="mt-2">{room.description}</p>
      </div>
    </div>
  );
}

export default RoomInfoBar;

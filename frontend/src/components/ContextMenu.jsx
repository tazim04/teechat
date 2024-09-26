import { useSocket } from "../context/SocketContext";
import { useState, useContext } from "react";
import { isDeleteOpenContext } from "./SideBar";

function ContextMenu({ setShowContextMenu }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { setIsDeleteOpen } = useContext(isDeleteOpenContext); // State for the modal visibility

  // Open modal to confirm user's choice to delete the room
  const openConfirmationModal = () => {
    setIsDeleteOpen(true);
  };

  return (
    <div className="w-32 text-[1rem] text-center text-gray-800 bg-gray-200 opacity-80 rounded-md shadow-md">
      <ul>
        <li>
          <div
            className="cursor-pointer hover:bg-gray-300 rounded-md"
            onClick={openConfirmationModal}
          >
            Delete Room
          </div>
        </li>
      </ul>
    </div>
  );
}

export default ContextMenu;

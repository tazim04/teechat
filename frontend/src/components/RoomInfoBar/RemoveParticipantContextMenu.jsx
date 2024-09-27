import { useSocket } from "../../context/SocketContext";
import { useState, useContext } from "react";

function RemoveParticipantContextMenu({
  participant,
  setShowConfirmationModal,
}) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context

  const openConfirmationModal = () => {
    console.log("Showing modal to remove", participant);
    setShowConfirmationModal(true);
  };

  return (
    <div className="w-40 py-1 text-[1rem] text-center bg-gray-200 hover:bg-red-500 text-gray-900 font-semibold hover:text-gray-50 opacity-80 rounded-md shadow-md">
      <ul>
        <li>
          <div
            className="cursor-pointer rounded-md"
            onClick={openConfirmationModal}
          >
            Remove Participant
          </div>
        </li>
      </ul>
    </div>
  );
}

export default RemoveParticipantContextMenu;

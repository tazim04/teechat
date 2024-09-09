import { useSocket } from "../context/SocketContext";
import { useState } from "react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

function ContextMenu({ room_id, setShowContextMenu }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [isOpen, setIsOpen] = useState(false); // State for the modal visibility

  const deleteRoom = () => {
    console.log("Deleting room: ", room_id);
    // socket.emit("delete_room", room_id); // Emit a "delete_room" event
    // setShowContextMenu(""); // Close the context menu
    setIsOpen(true); // Show the modal
  };

  return (
    <div className="w-32 text-[1rem] text-center text-gray-800 bg-gray-200 opacity-80 rounded-md shadow-md">
      <ul>
        <li>
          <div
            className="cursor-pointer hover:bg-gray-300 rounded-md"
            onClick={deleteRoom}
          >
            Delete Room
          </div>
        </li>
      </ul>
      <DeleteConfirmationModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}

export default ContextMenu;

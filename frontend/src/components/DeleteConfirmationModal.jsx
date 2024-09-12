import { set } from "mongoose";
import Modal from "react-modal";
import { useContext } from "react";
import { isDeleteOpenContext } from "./SideBar"; // Import the context object for the delete confirmation modal
import { useSocket } from "../context/SocketContext";

Modal.setAppElement("#root"); // Set the root element for the modal

function DeleteConfirmationModal({ room, setShowContextMenu }) {
  const { isDeleteOpen, setIsDeleteOpen } = useContext(isDeleteOpenContext); // State for the modal visibility
  const socket = useSocket(); // Use custom hook to get the socket object from the context

  const closeModal = () => {
    setIsDeleteOpen(false);
  };

  const modalStyles = {
    content: {
      width: "50%",
      height: "50%",
      margin: "auto",
    },
  };

  const deleteRoom = () => {
    console.log("Deleting room: ", room.name);
    socket.emit("delete_room", room.id); // Emit a "delete_room" event
    setIsDeleteOpen(false); // Close the modal
  };

  return (
    <Modal
      isOpen={isDeleteOpen}
      overlayClassName="fixed inset-0 bg-gray-500 bg-opacity-20 flex justify-center items-center"
      className="bg-white rounded-lg w-full max-w-lg mx-auto shadow-lg p-6"
    >
      <h3 className="p-3">
        Delete <b>{room.name}</b> for all eternity?
      </h3>
      <div className="p-3 ">
        {room.is_group ? (
          <p>
            Are you sure you want to delete <b>{room.name}</b>?{" "}
            <span className="text-red-500 font-bold">You can't undo this.</span>
          </p>
        ) : (
          <p>
            Are you sure you want to delete your room with <b>{room.name}</b>?{" "}
            <span className="text-red-500 font-bold">You can't undo this.</span>
          </p>
        )}
      </div>
      <div className="flex justify-center mt-7 space-x-5">
        <button
          onClick={closeModal}
          className="rounded-lg px-5 py-3 bg-gray-200 transition-all duration-150 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={deleteRoom}
          className="rounded-lg px-5 py-3 bg-red-400 text-white font-semibold transition-all duration-150 hover:bg-red-500"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

export default DeleteConfirmationModal;

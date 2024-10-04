import { set } from "mongoose";
import Modal from "react-modal";
import { useContext } from "react";
import { useSocket } from "../../context/SocketContext";

Modal.setAppElement("#root"); // Set the root element for the modal

function RemoveParticipantConfirmationModal({
  participant,
  room,
  setShowContextMenu,
  showConfirmationModal,
  setShowConfirmationModal,
}) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context

  const modalStyles = {
    content: {
      width: "50%",
      height: "50%",
      margin: "auto",
    },
  };

  const closeModal = () => {
    setShowConfirmationModal(false);
  };

  const removeParticipant = () => {
    socket.emit("remove_user_from_room", room._id, participant._id); // Emit a "delete_room" event
    setShowConfirmationModal(false); // Close the modal
    setShowContextMenu(""); // reset showContextMenu state
  };

  return (
    <Modal
      isOpen={showConfirmationModal}
      overlayClassName="fixed inset-0 bg-gray-500 bg-opacity-20 flex justify-center items-center"
      className="bg-white rounded-lg w-full max-w-lg mx-auto shadow-lg p-6"
    >
      <h3 className="p-3">Remove {participant.username}?</h3>
      <div className="p-3 ">
        <p>
          Are you sure you want to remove <b>{participant.username}</b> from{" "}
          <b>{room.name}</b>?{" "}
        </p>
      </div>
      <div className="flex justify-center mt-7 space-x-5">
        <button
          onClick={closeModal}
          className="rounded-lg px-5 py-3 bg-gray-200 transition-all duration-150 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={removeParticipant}
          className="rounded-lg px-5 py-3 bg-red-400 text-white font-semibold transition-all duration-150 hover:bg-red-500"
        >
          Remove
        </button>
      </div>
    </Modal>
  );
}

export default RemoveParticipantConfirmationModal;

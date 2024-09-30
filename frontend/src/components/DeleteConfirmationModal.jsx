import { set } from "mongoose";
import Modal from "react-modal";
import { useContext, useEffect, useCallback, useRef } from "react";
import { isDeleteOpenContext } from "./SideBar"; // Import the context object for the delete confirmation modal
import { useSocket } from "../context/SocketContext";
import toast, { Toaster } from "react-hot-toast";
import { userContext } from "../context/UserContext";

Modal.setAppElement("#root"); // Set the root element for the modal

function DeleteConfirmationModal({
  room,
  setShowContextMenu,
  currentRoom,
  setCurrentRoom,
}) {
  const { isDeleteOpen, setIsDeleteOpen } = useContext(isDeleteOpenContext); // State for the modal visibility
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { user } = useContext(userContext);

  // useRefs to ensure always up to date data for useCallBack
  const roomRef = useRef(room);
  const currentRoomRef = useRef(currentRoom);

  // Update the refs whenever `room` or `currentRoom` changes
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

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

  const handleRoomDeleted = useCallback(
    (wasSuccessful) => {
      toast.dismiss();

      const room = roomRef.current;
      const currentRoom = currentRoomRef.current;

      if (wasSuccessful) {
        if (room.is_group) {
          toast.success(`Deleted room: ${room.name}!`);
        } else {
          toast.success(`Deleted room with ${room.name}!`);
        }
      } else {
        if (room.is_group) {
          toast.error(
            `There was a problem! We couldn't delete your room ${room.name}`
          );
        } else {
          toast.error(
            `There was a problem! We couldn't delete your room with ${room.name}`
          );
        }
      }
      console.log("currentRoom: ", currentRoom);
      console.log("room: ", room);
      // Reset current room if it's the deleted room
      if (room._id === currentRoom._id) {
        setCurrentRoom(null);
      }
    },
    [setCurrentRoom]
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("room_deleted", handleRoomDeleted);
  }, [socket, setCurrentRoom]);

  const deleteRoom = () => {
    console.log("currentRoom: ", currentRoom);
    const toastId = toast.loading(`Deleting room ${room.name}...`);
    setIsDeleteOpen(false); // Close the modal
    socket.emit("delete_room", room._id); // Emit a "delete_room" event
  };

  return (
    <Modal
      isOpen={isDeleteOpen}
      overlayClassName="fixed inset-0 bg-gray-500 bg-opacity-20 flex justify-center items-center"
      className="bg-white rounded-lg w-full max-w-lg mx-auto shadow-lg p-6"
    >
      <Toaster />
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

import { set } from "mongoose";
import AvatarIcon from "./AvatarIcon";
import ContextMenu from "./ContextMenu";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useState, useRef, useEffect, useContext } from "react";
import { isDeleteOpenContext } from "./SideBar"; // Import the context object for the delete confirmation modal
import { useSocket } from "../context/SocketContext";
import { usePalette } from "../context/PaletteContext";
import { format, isToday } from "date-fns";

function RoomCard({
  room,
  openChat,
  checkOnline,
  selectedRoomContext,
  setSelectedRoomContext,
  currentRoom,
  setCurrentRoom,
}) {
  const { palette } = usePalette();
  const contextMenuRef = useRef(null);
  const contextMenuIconRef = useRef(null);
  const socket = useSocket();

  const [lastMessages, setLastMessages] = useState({});
  const [showContextMenu, setShowContextMenu] = useState("");

  const { isDeleteOpen } = useContext(isDeleteOpenContext); // Get the isDeleteOpen state from the context

  useEffect(() => {
    if (socket) {
      socket.on("recieve_last_message", (messageData) => {
        console.log("lastMessage: ", messageData);

        const roomId = messageData.room_id;
        const { room_id, ...exclude_room_id } = messageData;

        setLastMessages((prevMessages) => ({
          ...prevMessages,
          [roomId]: messageData,
        }));
      });

      // fetch the last message to display
      socket.emit("fetch_last_message", room._id);
    }

    return () => {
      socket.off("recieve_last_message");
    };
  }, [socket, room._id]);

  const handleContextMenu = (e) => {
    e.stopPropagation();

    if (showContextMenu === room._id) {
      setShowContextMenu(""); // Close the context menu if it's already open
      setSelectedRoomContext(""); // Reset the selected room for the context menu
    } else {
      console.log("room: ", room);
      setShowContextMenu(room._id); // Show the context menu for the clicked room (room id)
      setSelectedRoomContext(room); // Set the selected room for the context menu
    }
  };

  // Handle closing context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target) &&
        contextMenuIconRef.current &&
        !contextMenuIconRef.current.contains(e.target)
      ) {
        setShowContextMenu(""); // Close the context menu if click is outside of it
      }
    };

    // Add event listener to the document to listen for clicks
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener when the component is unmounted
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDeleteOpen]);

  const getTimeStamp = (timestamp) => {
    // console.log("Timestamp:", timestamp);
    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, "hh:mm a"); // Format the timestamp to human-readable time
    } else {
      return format(date, "MMM d, yyyy - hh:mm a"); // Include the date if the message is not from today
    }
  };

  return (
    <div className="flex row relative mb-5" id={room.name}>
      <div
        className={`flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer hover:bg-opacity-40 hover:bg-gray-300`}
        style={{ width: "95%" }}
        onClick={() => openChat(room)}
        id={room._id}
      >
        <div className="w-12 h-12 ">
          <AvatarIcon
            name={room.name}
            showStatus={!room.is_group}
            isOnline={checkOnline(room)}
          />
        </div>
        <div className="absolute left-24 top-0">{room.name}</div>
        <span className="text-[0.8rem] text-gray-200 absolute top-[0.2rem] right-16">
          {lastMessages[room._id] &&
            getTimeStamp(lastMessages[room._id].timestamp)}
        </span>
        {lastMessages[room._id] && (
          <span className="absolute bottom-2 left-24 text-[1rem] text-gray-200 w-40 overflow-x-hidden">
            {lastMessages[room._id].sender.username}:&nbsp;
            {lastMessages[room._id].content}
          </span>
        )}
      </div>

      <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
        <img
          ref={contextMenuIconRef}
          src="./room_context_menu.svg"
          className="invert w-6 trasntion-all duration-200 ease-in-out hover:contrast-50 m-2 cursor-pointer"
          onClick={handleContextMenu}
          alt=""
        />
      </div>
      {showContextMenu === room._id && (
        <div ref={contextMenuRef} className="absolute -right-24 top-8">
          <ContextMenu setShowContextMenu={setShowContextMenu} />
        </div>
      )}
      <DeleteConfirmationModal
        room={selectedRoomContext}
        setShowContextMenu={setShowContextMenu}
        currentRoom={currentRoom}
        setCurrentRoom={setCurrentRoom}
      />
    </div>
  );
}

export default RoomCard;

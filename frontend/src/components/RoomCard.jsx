import { set } from "mongoose";
import { usePalette } from "../context/PaletteContext";
import AvatarIcon from "./AvatarIcon";
import ContextMenu from "./ContextMenu";
import { useState, useRef, useEffect, useContext } from "react";
import { isDeleteOpenContext } from "./SideBar"; // Import the context object for the delete confirmation modal
import DeleteConfirmationModal from "./DeleteConfirmationModal";

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
  const [showContextMenu, setShowContextMenu] = useState("");
  const contextMenuRef = useRef(null);
  const contextMenuIconRef = useRef(null);

  const { isDeleteOpen } = useContext(isDeleteOpenContext); // Get the isDeleteOpen state from the context

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

  // Handle closing of context menu when clicking outside
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

  return (
    <div className="flex row" style={{ position: "relative" }} id={room.name}>
      <div
        className={`flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer hover:bg-opacity-40 hover:bg-gray-300`}
        style={{ width: "95%" }}
        onClick={() => openChat(room)}
        id={room._id}
      >
        <div className="w-10 h-10">
          <AvatarIcon
            name={room.name}
            showStatus={!room.is_group}
            isOnline={checkOnline(room)}
          />
        </div>
        <div
          className=""
          style={{
            position: "relative",
            right: "1.3rem",
            top: "0.8rem",
          }}
        ></div>
        <div className="absolute left-24">{room.name}</div>
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

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
}) {
  const { palette } = usePalette();
  const [showContextMenu, setShowContextMenu] = useState("");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);

  const { isDeleteOpen } = useContext(isDeleteOpenContext); // Get the isDeleteOpen state from the context

  const handleContextMenu = (e) => {
    e.preventDefault();
    // Set the position of the context menu based on the mouse click with a small offset
    setMenuPosition({
      x: e.clientX + 10,
      y: e.clientY - 20, // Slight upward offset to better align with the mouse click
    });

    console.log(e.target.id);

    setShowContextMenu(e.target.id); // Show the context menu for the clicked room (room id)
    setSelectedRoomContext(room); // Set the selected room for the context menu

    console.log("Right Click");
  };

  // Handle closing of context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target)
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
    <div className="flex row" style={{ position: "relative" }}>
      <div
        className={`flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer hover:bg-opacity-40 hover:bg-gray-300`}
        style={{ width: "95%" }}
        onClick={() => openChat(room)}
        onContextMenu={handleContextMenu}
        id={room.id}
      >
        <AvatarIcon username={room.name} />
        <div
          className=""
          style={{
            position: "relative",
            right: "1.3rem",
            top: "0.8rem",
          }}
        >
          {!room.is_group &&
            (checkOnline(room) ? (
              <span className="flex w-2.5 h-2.5 bg-green-400 rounded-full me-1.5 flex-shrink-0"></span>
            ) : (
              <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full me-1.5 flex-shrink-0"></span>
            ))}
        </div>
        {room.name}
      </div>
      {showContextMenu === room.id && (
        <div
          ref={contextMenuRef}
          className="fixed"
          style={{
            top: `${menuPosition.y}px`,
            left: `${menuPosition.x}px`,
          }}
        >
          <ContextMenu room={room} setShowContextMenu={setShowContextMenu} />
        </div>
      )}
      <DeleteConfirmationModal
        room={selectedRoomContext}
        setShowContextMenu={setShowContextMenu}
      />
    </div>
  );
}

export default RoomCard;

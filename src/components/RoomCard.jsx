import { set } from "mongoose";
import { usePalette } from "../context/PaletteContext";
import AvatarIcon from "./AvatarIcon";
import ContextMenu from "./ContextMenu";
import { useState, useRef, useEffect } from "react";

function RoomCard({ room, openChat, checkOnline }) {
  const { palette } = usePalette();
  const [showContextMenu, setShowContextMenu] = useState("");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    // Set the position of the context menu based on the mouse click with a small offset
    setMenuPosition({
      x: e.clientX + 10,
      y: e.clientY - 20, // Slight upward offset to better align with the mouse click
    });

    console.log(e.target.id);

    setShowContextMenu(e.target.id); // Show the context menu for the clicked room (room id)

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
  }, []);

  return (
    <div className="flex row" style={{ position: "relative" }}>
      <div
        className={`flex rounded-md py-2 px-5 mx-auto items-center transition ease-in-out cursor-pointer ${palette.sideBarHover}`}
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
          {checkOnline(room) ? (
            <span className="flex w-2.5 h-2.5 bg-green-400 rounded-full me-1.5 flex-shrink-0"></span>
          ) : (
            <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full me-1.5 flex-shrink-0"></span>
          )}
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
          <ContextMenu
            room_id={showContextMenu}
            setShowContextMenu={setShowContextMenu}
          />
        </div>
      )}
    </div>
  );
}

export default RoomCard;

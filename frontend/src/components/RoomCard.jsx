import { set } from "mongoose";
import AvatarIcon from "./AvatarIcon";
import ContextMenu from "./ContextMenu";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useState, useRef, useEffect, useContext } from "react";
import { isDeleteOpenContext } from "./SideBar"; // Import the context object for the delete confirmation modal
import { useSocket } from "../context/SocketContext";
import { usePalette } from "../context/PaletteContext";
import { userContext } from "../context/UserContext";
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
  const { user } = useContext(userContext);

  const [lastMessages, setLastMessages] = useState({});
  const [showContextMenu, setShowContextMenu] = useState("");
  const [showNewMessage, setShowNewMessage] = useState({});

  const { isDeleteOpen } = useContext(isDeleteOpenContext); // Get the isDeleteOpen state from the context

  useEffect(() => {
    if (socket) {
      socket.on("recieve_last_message", (messageData) => {
        console.log("lastMessage: ", messageData);

        const roomId = messageData?.room_id; // Ensure you get the room_id safely using optional chaining

        if (!messageData || !roomId) {
          console.warn("Message data or room ID is missing");
          return;
        }

        // Ensure `readBy` is always present (even if it's an empty array)
        const updatedMessageData = {
          ...messageData,
          readBy: messageData.readBy || [], // Ensure `readBy` is always an array
        };

        // Update the lastMessages state with the new message data
        setLastMessages((prevMessages) => ({
          ...prevMessages,
          [roomId]: updatedMessageData,
        }));

        console.log("updatedMessageData:", updatedMessageData);

        const isCurrentRoom = roomId === currentRoom?._id;
        console.log("current room?", currentRoom?._id, roomId);

        // dont do anything if it is the current room
        if (isCurrentRoom) {
          console.log("message is for the currently open room.");
          setShowNewMessage((prevMessages) => ({
            ...prevMessages,
            [roomId]: false, // add it to the reference of that room in the showNewMessage state
          }));
          return;
        }

        // // boolean for if the message is new and unread
        const unread =
          !updatedMessageData.readBy.includes(user._id) &&
          updatedMessageData.sender._id !== user._id;

        // console.log("unread:", unread);
        console.log(
          "Message is for current room:",
          roomId !== currentRoom?._id
        );

        setShowNewMessage((prevMessages) => ({
          ...prevMessages,
          [roomId]: unread, // add it to the reference of that room in the showNewMessage state
        }));
      });

      // fetch the last message to display
      socket.emit("fetch_last_message", room._id);
    }

    return () => {
      socket.off("recieve_last_message");
      socket.off("message_read_update");
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
      return format(date, "MMM d, yyyy"); // Include the date if the message is not from today
    }
  };

  return (
    <div className="flex row relative mb-3" id={room.name}>
      {/* {showNewMessage[room._id] && room.messages.length > 0 && (
        <span className="flex w-2.5 h-2.5 bg-gray-400 rounded-full flex-shrink-0"></span>
      )} */}
      <div
        className={`flex ${
          (showNewMessage[room._id] ||
            (currentRoom && currentRoom._id === room._id)) &&
          "font-bold"
        } ${
          currentRoom &&
          currentRoom._id === room._id &&
          "bg-gray-300 bg-opacity-20"
        } rounded-md py-2 px-3 mx-auto items-center transition ease-in-out cursor-pointer hover:bg-opacity-40 hover:bg-gray-300`}
        style={{ width: "95%" }}
        onClick={() => {
          openChat(room);
          setShowNewMessage((prevMessages) => ({
            ...prevMessages,
            [room._id]: false,
          }));
        }}
        id={room._id}
      >
        <div className="w-12 h-12 ">
          <AvatarIcon
            name={room.name}
            showStatus={!room.is_group}
            isOnline={checkOnline(room)}
          />
        </div>
        <span
          className={`absolute left-[5rem] top-0 truncate ${
            lastMessages[room._id]?.content ? "w-[8rem] " : "w-[12rem]" // increase width when timestamp isnt shown for less truncate
          }`}
        >
          {room.name}
        </span>

        {lastMessages[room._id]?.content ? (
          <div>
            <span className="text-[0.8rem] text-gray-200 absolute top-[0.2rem] right-11">
              {getTimeStamp(lastMessages[room._id].timestamp)}
            </span>
            <span className="absolute bottom-2 left-[5rem] text-[1rem] text-gray-200 w-48 truncate">
              {lastMessages[room._id].sender.username}:&nbsp;
              {lastMessages[room._id].content}
            </span>
          </div>
        ) : (
          <span className="absolute bottom-2 left-[5.4rem] text-[1rem] text-gray-200 w-48 truncate">
            {"No messages yet!"}
          </span>
        )}
      </div>

      <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
        <img
          ref={contextMenuIconRef}
          src="./room_context_menu.svg"
          className="invert w-6 trasntion-all duration-200 ease-in-out hover:contrast-50 m-2 cursor-pointer"
          onClick={handleContextMenu}
          alt=""
        />
      </div>
      {showContextMenu === room._id && (
        <div ref={contextMenuRef} className="absolute right-0 top-11">
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

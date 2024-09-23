import { useState, useContext } from "react";
import AvatarIcon from "../components/AvatarIcon";
import { format, isToday } from "date-fns";
import { usePalette } from "../context/PaletteContext";
import { userContext } from "../context/UserContext";

function MessageBubble({
  msg,
  isCurrentUser,
  showAvatar,
  prevSender,
  timeDifference,
  index,
}) {
  const [hoverMessage, setHoverMessage] = useState(false); // State for the hover message
  const { palette } = usePalette(); // Destructure palette from usePalette
  const { user } = useContext(userContext); // Get the user from the context
  const username = user.username; // Get the username from the context

  const getTimeStamp = (timestamp) => {
    // console.log("Timestamp:", timestamp);
    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, "hh:mm a"); // Format the timestamp to human-readable time
    } else {
      return format(date, "MMM d, yyyy - hh:mm a"); // Include the date if the message is not from today
    }
  };

  const handleMessageHover = (index) => {
    setHoverMessage(index); // Set the hover message state to true
  };
  const handleMessageLeave = () => {
    setHoverMessage(null); // Reset the hover message state
  };

  return isCurrentUser ? (
    <div className="flex justify-end">
      <div className="flex items-start gap-2">
        <div
          className="flex flex-row items-end"
          onMouseEnter={() => handleMessageHover(index)}
          onMouseLeave={handleMessageLeave}
        >
          <div
            className={`text-sm pr-1 mx-2 transition-opacity ease-in-out delay-75 ${
              hoverMessage === index ? "opacity-100" : "opacity-0"
            }`}
          >
            {getTimeStamp(msg.timestamp)}
          </div>
          <div
            className={`${
              palette.messageBubble
            } px-3 py-2 me-2 rounded-s-xl inline-block max-w-[320px] min-w-[0] break-words font-medium
                ${showAvatar ? "mt-3 rounded-br-xl" : "mt-1 rounded-r-xl"}
                `}
          >
            <p>{msg.content}</p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    // If the message is not from the current user
    <div className={`flex justify-start ${showAvatar ? "mt-4" : ""}`}>
      {showAvatar ? (
        <div className="h-10 w-10 me-3">
          <AvatarIcon
            name={msg.sender.username}
            showStatus={false}
            isOnline={false}
          />
        </div>
      ) : (
        <div className="w-10 h-10 me-3"></div> // Placeholder for the avatar
      )}
      <div className="flex items-start gap-2">
        <div
          className="flex flex-row items-end"
          onMouseEnter={() => handleMessageHover(index)}
          onMouseLeave={handleMessageLeave}
        >
          <div
            className={`bg-gray-100 px-3 py-2 border-gray-200 text-black rounded-e-xl  inline-block max-w-[320px] min-w-[0] break-words font-medium ${
              showAvatar ? "mt-4 rounded-bl-xl" : "mt-1 rounded-s-xl"
            }`}
          >
            <p>{msg.content}</p>
          </div>
          <div
            className={`text-sm pr-1 mx-2 transition-opacity ease-in-out delay-75 ${
              hoverMessage === index ? "opacity-100" : "opacity-0"
            }`}
          >
            {getTimeStamp(msg.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;

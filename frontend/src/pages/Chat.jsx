import { useSocket } from "../context/SocketContext";
import ChatBar from "../components/ChatBar";
import MessageBubble from "../components/MessageBubble";
import { useEffect, useState, useRef, useContext } from "react";
import "./stylesheets/Chat.css";
import { usePalette } from "../context/PaletteContext";
import { userContext } from "../context/UserContext";
import RoomInfoBar from "../components/RoomInfoBar";

function Chat({ currentRoom, messages, setMessages }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [message, setMessage] = useState(""); // State for the message
  const [users, setUsers] = useState([]); // State for the users
  const [showScrollToBottom, setShowScrollToBottom] = useState(false); // State for the scroll to bottom button
  const [atBottom, setAtBottom] = useState(true); // State for the scroll position
  const [sendAnimation, setSendAnimation] = useState(false); // State for the send animation
  const [emptyMessageAnimation, setEmptyMessageAnimation] = useState(false); // State for the empty message animation
  const [showRoomInfo, setShowRoomInfo] = useState(true); // State for the room info bar

  const { palette } = usePalette(); // Destructure palette from usePalette
  const { user } = useContext(userContext); // Get the user info from the context
  const username = user.username; // Get the username from the context

  const bottomRef = useRef(); // Reference to the bottom of the chat

  const [scrollPosition, setScrollPosition] = useState(0);

  // Track if the user is at the bottom of the chat using observer for the scroll down button
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setShowScrollToBottom(!entry.isIntersecting); // Update the atBottom state
    });
    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }
    return () => {
      observer.disconnect();
    };
  });

  // Scroll to the bottom of the chat when the room is opened or a new message is sent
  useEffect(() => {
    if (bottomRef.current) {
      // console.log("Scrolling to the bottom of the chat...", bottomRef.current);
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    } else {
      // console.log("bottomRef.current is null");
    }
  }, [messages, currentRoom.name]);

  // Listen for events when the component mounts
  useEffect(() => {
    if (socket && socket.connected) {
      // Listen for received messages -  NEED TO IMPLEMENT GROUP CHAT FUNCTIONALITY
      socket.on("recieve_message", (messageData) => {
        console.log("Message received:", messageData); // Log the received message
        let content = messageData.content;
        let sender = messageData.sender;
        let timestamp = messageData.timestamp;

        let messageContent = {
          sender: sender,
          content: content,
          timestamp: timestamp,
        };

        setMessages((prevMessages) => {
          return {
            ...prevMessages,
            [currentRoom._id]: [
              ...(prevMessages[currentRoom._id] || []),
              messageContent,
            ], // Update the messages state with this dm
          };
        });
      });

      // Listen for previous messages
      socket.on("recieve_previous_messages", (previousMessages) => {
        setMessages((prevMessages) => {
          return {
            ...prevMessages,
            [currentRoom._id]: [...previousMessages], // Update the messages state for this dm
          };
        });
      });
    }
    return () => {
      // Clean up the event listeners

      if (socket) {
        socket.off("recieve_message");
        socket.off("recieve_previous_messages");
      }
    };
  }, [socket, currentRoom, user, messages]);

  const onType = (e) => {
    let message = e.target.value;
    setMessage(message); // Update the message state
  };

  const send = () => {
    if (!message) {
      setEmptyMessageAnimation(true); // Set the empty message animation to true
      setTimeout(() => {
        setEmptyMessageAnimation(false); // Reset the empty message animation
      }, 500);
      return; // If the message is empty, do nothing
    } // If the message is empty, do nothing

    const sender = { _id: user._id, username: user.username }; // Get the sender info

    let messageContent = {
      content: message,
      sender: sender,
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => {
      return {
        ...prevMessages,
        [currentRoom._id]: [
          ...(prevMessages[currentRoom._id] || []),
          messageContent,
        ], // Update the messages state for this dm
      };
    });

    socket.emit(
      "dm",
      message,
      currentRoom.id,
      currentRoom.name,
      user._id,
      currentRoom.is_group
    ); // Emit a message, FOR NOW ROOM IS JUST A USER
    setMessage(""); // Clear the message input

    setSendAnimation(true); // Set the send animation to true
    setTimeout(() => {
      setSendAnimation(false); // Reset the send animation
    }, 2000);
  };

  // console.log(room.id);

  return (
    <div className="flex flex-row flex-1">
      {/* <ChatBar room={currentRoom} /> Display the chat bar */}

      {currentRoom ? ( // Check if the room (recipient) is selected
        <div className="flex flex-col flex-1 h-screen">
          <ChatBar
            room={currentRoom}
            showRoomInfo={showRoomInfo}
            setShowRoomInfo={setShowRoomInfo}
          />
          <div className="flex-1 overflow-y-auto p-4">
            {/* Check if there are messages for the selected recipient */}
            {messages[currentRoom._id] ? (
              messages[currentRoom._id].map((msg, index, arr) => {
                // console.log(messages[currentRoom.name]);
                const isCurrentUser = msg.sender.username === username; // Check if the message is from the current user

                const prevSender = arr[index - 1]?.sender; // Get the previous sender
                const nextSender = arr[index + 1]?.sender; // Get the next sender

                // console.log("Prev sender:", prevSender);

                const currentMessageTime = new Date(msg.timestamp); // Get the current message time
                const prevMessageTime = new Date(arr[index - 1]?.timestamp); // Get the previous message time
                const timeDifference = currentMessageTime - prevMessageTime; // Calculate the time difference between the current and previous message

                const showAvatar =
                  index === 0 || // First message always shows the avatar
                  timeDifference > 60000 || // Show the avatar if the time difference is more than 1 minute
                  prevSender?.username !== msg.sender.username; // Show the avatar if the previous sender is different

                return (
                  <div key={index}>
                    <MessageBubble
                      msg={msg}
                      isCurrentUser={isCurrentUser}
                      showAvatar={showAvatar}
                      prevSender={prevSender}
                      timeDifference={timeDifference}
                      index={index}
                    />
                  </div>
                );
              })
            ) : (
              <p>No messages in this conversation</p>
            )}

            {/* Scroll to bottom button */}
            {showScrollToBottom && (
              <div className="flex justify-center">
                <button
                  className={`${palette.scrollBottom} ${palette.scrollBottomHover} scroll-to-bottom text-[1.5rem] rounded-full fixed bottom-28 w-10 h-10 flex items-center justify-center 
                  animate-bounce transition ease-in-out delay-3 duration-300`}
                  onClick={() => {
                    bottomRef.current.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  ↓
                </button>
              </div>
            )}

            {/* Reference to the bottom of the chat */}
            <div ref={bottomRef}></div>
          </div>
          <div className=" px-2 mx-3 mb-4 mt-5 border-gray-300 rounded-2xl border-2 flex">
            <input
              type="text"
              placeholder={`Message ${currentRoom.name}`}
              className="w-full h-12 font-medium focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-4 bg-white rounded-md py-2"
              value={message}
              onChange={onType}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              className={`${palette.send} rounded-xl px-3 h-9 ms-5 my-auto overflow-hidden relative`}
              onClick={send}
            >
              <img
                src="./send_icon.png"
                alt=""
                className={`h-auto w-6 mx-2 ${
                  sendAnimation ? "send-animation" : ""
                } ${emptyMessageAnimation ? "empty-message-animation" : ""}`}
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center items-center h-full">
          <img src="/favicon.png" alt="TeeChat" className="w-auto h-28" />
          <h2 className="text-2xl font-bold leading-9 tracking-tight text-gray-900">
            TeeChat
          </h2>
          <p className="mt-4 text-[1.3rem]">Welcome back {username}!</p>
        </div>
      )}
      {showRoomInfo && currentRoom && (
        <RoomInfoBar
          room={currentRoom}
          showRoomInfo={showRoomInfo}
          setShowRoomInfo={setShowRoomInfo}
        />
      )}
    </div>
  );
}

export default Chat;

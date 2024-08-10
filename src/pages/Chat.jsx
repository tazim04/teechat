import { useSocket } from "../context/SocketContext";
import ChatBar from "../components/ChatBar";
import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import SideBar from "../components/SideBar";
import AvatarIcon from "../components/AvatarIcon";
import { set } from "mongoose";
import { format, isToday } from "date-fns";
import "./stylesheets/Chat.css";

function Chat({ username, room, messages, setMessages }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [message, setMessage] = useState(""); // State for the message
  const [users, setUsers] = useState([]); // State for the users
  const [showScrollToBottom, setShowScrollToBottom] = useState(false); // State for the scroll to bottom button
  const [atBottom, setAtBottom] = useState(true); // State for the scroll position
  const [sendAnimation, setSendAnimation] = useState(false); // State for the send animation
  const [emptyMessageAnimation, setEmptyMessageAnimation] = useState(false); // State for the empty message animation
  const [hoverMessage, setHoverMessage] = useState(false); // State for the hover message

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
      console.log("Scrolling to the bottom of the chat...", bottomRef.current);
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    } else {
      console.log("bottomRef.current is null");
    }
  }, [messages, room.name]);

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
            [sender]: [...(prevMessages[sender] || []), messageContent], // Update the messages state for this dm
          };
        });
      });

      // Listen for previous messages
      socket.on("recieve_previous_messages", (previousMessages) => {
        setMessages((prevMessages) => {
          return {
            ...prevMessages,
            [room.name]: [...previousMessages], // Update the messages state for this dm
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
  }, [socket, room.name, username, setMessages]);

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
    console.log(
      "Sending message: " +
        message +
        " to room: " +
        room.name +
        " from user: " +
        username
    );

    let messageContent = {
      content: message,
      sender: username,
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => {
      return {
        ...prevMessages,
        [room.name]: [...(prevMessages[room.name] || []), messageContent], // Update the messages state for this dm
      };
    });
    socket.emit("dm", message, room.id, room.name, username, room.is_group); // Emit a message, FOR NOW ROOM IS JUST A USER
    setMessage(""); // Clear the message input

    setSendAnimation(true); // Set the send animation to true
    setTimeout(() => {
      setSendAnimation(false); // Reset the send animation
    }, 2000);
  };

  const getTimeStamp = (timestamp) => {
    console.log("Timestamp:", timestamp);
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

  return (
    <div className="flex flex-col flex-1 h-screen">
      {room ? ( // Check if the room (recipient) is selected
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatBar room={room} /> {/* Display the chat bar */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Check if there are messages for the selected recipient */}
            {messages[room.name] ? (
              messages[room.name].map((msg, index, arr) => {
                const isCurrentUser = msg.sender === username; // Check if the message is from the current user
                const currentMessageTime = new Date(msg.timestamp); // Get the current message time
                const prevMessageTime = new Date(arr[index - 1]?.timestamp); // Get the previous message time
                const prevSender = arr[index - 1]?.sender; // Get the previous sender

                const timeDifference = currentMessageTime - prevMessageTime; // Calculate the time difference between the current and previous message

                const showAvatar =
                  index === 0 ||
                  timeDifference > 60000 ||
                  prevSender !== msg.sender; // Check if the avatar should be displayed

                return isCurrentUser ? (
                  <div className="flex justify-end" key={index}>
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
                          className={`bg-gradient-to-r from-purple-600 to-indigo-500 px-3 py-2 me-2 border-gray-200 text-white rounded-s-xl inline-block max-w-[320px] min-w-[0] break-words
                          ${
                            index === 0 ||
                            timeDifference > 60000 ||
                            prevSender !== msg.sender
                              ? "mt-3 rounded-br-xl"
                              : "mt-1 rounded-r-xl"
                          }
                          `}
                        >
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start" key={index}>
                    {showAvatar ? (
                      <AvatarIcon username={msg.sender} />
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
                          className={`bg-gray-100 px-3 py-2 border-gray-200 text-black rounded-e-xl  inline-block max-w-[320px] min-w-[0] break-words ${
                            index === 0 ||
                            timeDifference > 60000 ||
                            prevSender !== msg.sender
                              ? "mt-3 rounded-bl-xl"
                              : " mt-1 rounded-s-xl"
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
              })
            ) : (
              <p>No messages in this conversation</p>
            )}

            {/* Scroll to bottom button */}
            {showScrollToBottom && (
              <div className="flex justify-center">
                <button
                  className="scroll-to-bottom fixed bottom-28 text-purple-500 border-2 border-purple-500 px-2 animate-bounce 
                  transition ease-in-out delay-3 hover:bg-purple-500 hover:text-white duration-300"
                  style={{ fontSize: "1.5rem", borderRadius: "50%" }}
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
              placeholder={`Message ${room.name}`}
              className="w-full h-12 font-medium focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-4 bg-white rounded-md py-2"
              value={message}
              onChange={onType}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              className="bg-purple-500 text-white rounded-xl px-3 h-9 ms-5 my-auto hover:bg-purple-400 overflow-hidden relative"
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
        <div className="flex justify-center py-10">
          <h1>Hi {username}!</h1>
        </div>
      )}
    </div>
  );
}

export default Chat;

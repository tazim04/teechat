import { useSocket } from "../context/SocketContext";
import ChatBar from "../components/ChatBar";
import MessageBubble from "../components/MessageBubble";
import { useEffect, useState, useRef, useContext, createRef } from "react";
import "./stylesheets/Chat.css";
import { usePalette } from "../context/PaletteContext";
import { userContext } from "../context/UserContext";
import { onlineUsersContext } from "../context/OnlineUsersContext";
import { isMobileContext } from "../context/IsMobileContext";
import RoomInfoBar from "../components/RoomInfoBar/RoomInfoBar";

function Chat({ currentRoom, setCurrentRoom, messages, setMessages }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const [message, setMessage] = useState(""); // State for the message
  const [users, setUsers] = useState([]); // State for the users
  const [showScrollToBottom, setShowScrollToBottom] = useState(false); // State for the scroll to bottom button
  const [atBottom, setAtBottom] = useState(true); // State for the scroll position
  const [sendAnimation, setSendAnimation] = useState(false); // State for the send animation
  const [emptyMessageAnimation, setEmptyMessageAnimation] = useState(false); // State for the empty message animation
  const [showRoomInfo, setShowRoomInfo] = useState(true); // State for the room info bar
  const [participants, setParticipants] = useState([]); // State for the participants for RoomInfoBar
  const [isOnline, setIsOnline] = useState(false);

  const { palette } = usePalette(); // Destructure palette from usePalette
  const { onlineUsers } = useContext(onlineUsersContext); // Get the online users from the context
  const { user } = useContext(userContext); // Get the user info from the context
  const { isMobile } = useContext(isMobileContext);
  const username = user.username; // Get the username from the context

  const bottomRef = useRef(); // Reference to the bottom of the chat
  const chatRef = useRef();

  const [scrollPosition, setScrollPosition] = useState(0);

  // for mobile
  useEffect(() => {
    const setDynamicHeight = () => {
      if (isMobile && chatRef.current) {
        chatRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    setDynamicHeight(); // Set on initial load
    window.addEventListener("resize", setDynamicHeight);

    return () => window.removeEventListener("resize", setDynamicHeight);
  }, []);

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

  // If mobile, show room info is closed on open
  useEffect(() => {
    if (isMobile) {
      setShowRoomInfo(false);
    } else {
      setShowRoomInfo(true); // Always open on desktop
    }
  }, [isMobile, currentRoom]);

  // Scroll to the bottom of the chat when the room is opened or a new message is sent
  useEffect(() => {
    if (bottomRef.current) {
      // console.log("Scrolling to the bottom of the chat...", bottomRef.current);
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    } else {
      // console.log("bottomRef.current is null");
    }
  }, [messages, currentRoom]);

  // Listen for events when the component mounts
  useEffect(() => {
    if (socket && socket.connected) {
      // Listen for received messages
      socket.on("recieve_message", (messageData) => {
        if (messageData.room_id === currentRoom._id) {
          console.log("Message received:", messageData); // Log the received message

          setMessages((prevMessages) => {
            return {
              ...prevMessages,
              [currentRoom._id]: [
                ...(prevMessages[currentRoom._id] || []),
                messageData,
              ], // Update the messages state with this dm
            };
          });
        }
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

      // listen for message read
      socket.on("message_read_update", (message, room_id) => {
        console.log("message that user sent was read:", message);
        if (!messages[room_id]) {
          return;
        }
        // update message with updated readBy
        setMessages((prevMessages) => {
          return {
            ...prevMessages,
            [room_id]: prevMessages[room_id].map((msg) => {
              if (msg._id === message._id) {
                // Update the readBy field for the specific message
                return {
                  ...msg,
                  readBy: [...msg.readBy, message.readBy], // Append the user_id
                };
              }
              return msg;
            }),
          };
        });
        console.log("Updated messages:", messages);
      });

      // Fetch the participants for the room for RoomInfoBar
      if (currentRoom) {
        if (currentRoom.is_group) {
          socket.emit("fetch_room_participants", currentRoom._id);
        } else {
          socket.emit("fetch_user", user._id, currentRoom._id);
        }

        socket.on("receive_room_participants", (participants) => {
          // console.log("Participants: ", participants);
          setParticipants(participants);
        });
        socket.on("receive_user", (otherUser) => {
          setParticipants([otherUser]);
        });
      }
    }
    return () => {
      // Clean up the event listeners

      if (socket) {
        socket.off("recieve_message");
        socket.off("recieve_previous_messages");
        socket.off("message_read_update");
        socket.off("receive_room_participants");
        socket.off("receive_user");
      }
    };
  }, [socket, currentRoom, user, messages]);

  // useEffect for checking if the other user in the room is online
  useEffect(() => {
    const getOtherParticipantId = (room) => {
      const participants = room.participants;
      const otherParticipant = participants.find(
        (participant) => participant._id !== user._id
      );
      // console.log("Other participant:", otherParticipant);
      return otherParticipant._id;
    };

    const checkOnline = (participant_id) => {
      return onlineUsers.includes(participant_id);
    };

    if (currentRoom && currentRoom.participants && user) {
      const otherParticipantId = getOtherParticipantId(currentRoom);
      if (otherParticipantId) {
        const isOtherParticipantOnline = checkOnline(otherParticipantId);
        setIsOnline(isOtherParticipantOnline);
      }
    }
  });

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

    let tempMessage = {
      justSent: true,
      content: message,
      sender: sender,
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => {
      return {
        ...prevMessages,
        [currentRoom._id]: [
          ...(prevMessages[currentRoom._id] || []),
          tempMessage,
        ], // Update the messages state for this dm
      };
    });

    socket.emit(
      "dm",
      message,
      currentRoom._id,
      currentRoom.name,
      user._id,
      currentRoom.is_group,
      (dbMessage) => {
        console.log("Callback from server:", dbMessage);
        setMessages((prevMessages) => {
          return {
            ...prevMessages,
            [currentRoom._id]: prevMessages[currentRoom._id].map(
              (msg) => (msg.justSent ? dbMessage : msg) // Replace justSent message with the dbMessage
            ),
          };
        });
      }
    );
    setMessage(""); // Clear the message input

    setSendAnimation(true); // Set the send animation to true
    setTimeout(() => {
      setSendAnimation(false); // Reset the send animation
    }, 2000);
  };

  const [messageRefs, setMessageRefs] = useState([]); // hold refs for all the messages in the room

  // create refs for each message
  useEffect(() => {
    if (currentRoom) {
      if (messageRefs.length !== messages[currentRoom._id]?.length) {
        setMessageRefs((prevRefs) =>
          Array(messages[currentRoom._id]?.length)
            .fill()
            .map((_, i) => prevRefs[i] || createRef())
        );
      }
    }
  }, [messages, setMessages, currentRoom]);

  // UseEffect to handle visibility tracking outside the map
  useEffect(() => {
    const observers = new Map(); // map to store observers by message index

    const readMessage = (msg_id) => {
      if (msg_id) {
        console.log(`${msg_id} was read!`);
        socket.emit("message_read", msg_id, currentRoom._id, user._id);
      }
    };

    // attatch observers to message elements
    messageRefs.forEach((ref, index) => {
      if (currentRoom) {
        const message = messages[currentRoom._id]?.[index];

        if (
          ref.current &&
          message &&
          !observers.has(index) &&
          !message.readBy?.includes(user._id)
        ) {
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
              // mark as read only if it's from another user and hasn't been read
              if (message.readBy) {
                if (
                  message.sender._id !== user._id &&
                  !message.readBy.includes(user._id)
                ) {
                  console.log(`Reading message: ${message.content}`);
                  readMessage(message._id);
                }
                observer.unobserve(ref.current); // stop observing after read
              }
            }
          });

          observer.observe(ref.current); // start observing this message
          observers.set(index, observer); // store observer in the map
        }
      }
    });

    // clean up
    return () => {
      observers.forEach((observer, index) => {
        if (messageRefs[index]?.current) {
          observer.unobserve(messageRefs[index].current);
        }
      });
      observers.clear();
    };
  }, [messageRefs, messages, setMessages, currentRoom, user._id, socket]);

  return (
    <div className="flex md:flex-row flex-1">
      {/* <ChatBar room={currentRoom} /> Display the chat bar */}

      {currentRoom ? ( // Check if the room (recipient) is selected
        <div className="flex flex-col flex-1 md:h-screen" ref={chatRef}>
          <ChatBar
            room={currentRoom}
            showRoomInfo={showRoomInfo}
            setShowRoomInfo={setShowRoomInfo}
            isOnline={isOnline} // pass if online using the corresponding functions
            setCurrentRoom={setCurrentRoom}
          />
          <div className="flex-1 overflow-y-auto p-4">
            {/* Check if there are messages for the selected recipient */}
            {messages[currentRoom._id] ? (
              messages[currentRoom._id].map((msg, index, arr) => {
                if (!msg.sender) {
                  return; // If the message sender is not available, return
                }

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

                const isLastMsg =
                  index === messages[currentRoom._id].length - 1;

                return (
                  <div
                    key={index}
                    ref={messageRefs[index]}
                    className="relative"
                  >
                    <MessageBubble
                      msg={msg}
                      isCurrentUser={isCurrentUser}
                      showAvatar={showAvatar}
                      prevSender={prevSender}
                      timeDifference={timeDifference}
                      index={index}
                    />
                    {isLastMsg &&
                      msg?.readBy?.length > 0 &&
                      isCurrentUser && ( // Only show "Read" for the last message if it has been read
                        <span className="absolute right-[0.71rem] text-[0.75rem]">
                          Read
                        </span>
                      )}
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
        <div
          className={`${
            isMobile ? "absolute top-0 left-0 w-full h-full bg-white z-50" : ""
          }`}
        >
          <RoomInfoBar
            room={currentRoom}
            showRoomInfo={showRoomInfo}
            setShowRoomInfo={setShowRoomInfo}
            participants={participants}
            isOnline={isOnline}
          />
        </div>
      )}
    </div>
  );
}

export default Chat;

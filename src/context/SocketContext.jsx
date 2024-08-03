import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null); // Create a context object

const ENDPOINT = "http://localhost:3000"; // Define the endpoint

// Create a provider component that makes the socket object available to any child components
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null); // state for the socket object

  // Create a new socket connection when the component mounts
  useEffect(() => {
    const newSocket = io(ENDPOINT, {
      withCredentials: true,
    });

    // Add connection and disconnection event listeners
    const handleConnect = () => {
      console.log("Connected to the server!");
    };

    const handleDisconnect = () => {
      console.log("Disconnected from the server!");
    };

    newSocket.once("connect", handleConnect); // Listen for the connect event
    newSocket.on("disconnect", handleDisconnect); // Listen for the disconnect event

    setSocket(newSocket); // Set the socket object in the state

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.disconnect(); // Disconnect the socket when the component unmounts
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider> // Provide the socket object to the context
  );
};

// Create a custom hook to use the socket object
export const useSocket = () => {
  const context = useContext(SocketContext); // Get the socket object from the context
  return context;
};

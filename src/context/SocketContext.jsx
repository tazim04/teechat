import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { cors } from "cors";

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
    setSocket(newSocket);

    return () => {
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

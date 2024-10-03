import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import Cookies from "js-cookie";
import { userContext } from "./UserContext";
import { Link, useNavigate } from "react-router-dom";

const SocketContext = createContext(null); // Create a context object

const ENDPOINT = "http://localhost:3000"; // Define the endpoint

// Create a provider component that makes the socket object available to any child components
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null); // state for the socket object
  const { setUser } = useContext(userContext);
  const navigate = useNavigate();

  const authUser = (socketInstance, token) => {
    if (socketInstance && socketInstance.connected) {
      // console.log("authUser", token);

      // Emit an event to the server to verify the token
      socketInstance.emit("auth_token", token);

      // Listen for server's response
      socketInstance.on("auth_response", (response) => {
        // console.log("auth_response", response);
        if (response.success) {
          // console.log("User found from token", response.user.data);
          setUser(response.user.data); // Set the authenticated user
          navigate("/main"); // automatically navigate, skip sign-in page
        } else {
          console.error("Failed to authenticate user");
          Cookies.remove("token"); // Remove the token if invalid
        }
      });
    }
  };

  // Create a new socket connection when the component mounts
  useEffect(() => {
    const token = Cookies.get("token"); // get the token from cookies
    let newSocket;
    if (token) {
      newSocket = io(ENDPOINT, {
        withCredentials: true,
        auth: {
          token: token,
        },
      });
    } else {
      newSocket = io(ENDPOINT, {
        withCredentials: true,
      });
    }

    // connection and disconnection event listeners
    const handleConnect = () => {
      console.log("Connected to the server!");
      if (token) {
        authUser(newSocket, token);
      } else {
        console.warn("There is no token in cookies!");
      }
    };

    const handleDisconnect = () => {
      console.log("Disconnected from the server!");
    };

    newSocket.on("connect", handleConnect); // Listen for the connect event
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

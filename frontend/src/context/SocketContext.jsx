import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import Cookies from "js-cookie";
import { userContext } from "./UserContext";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const SocketContext = createContext(null); // Create a context object

const ENDPOINT = "http://localhost:3000"; // Define the endpoint

// Function to check if the token is about to expire
const isTokenExpiringSoon = (token) => {
  const decodedToken = jwtDecode(token);
  const currentTime = Date.now() / 1000; // Current time in seconds

  const timeLeftInSeconds = decodedToken.exp - currentTime; // to be used

  // const timeLeftInMinutes = (timeLeftInSeconds / 60).toFixed(2); // for logs only
  // console.log("Time left: ", timeLeftInMinutes);

  return timeLeftInSeconds < 60; // Refresh if less than 1 minute left
};

// Provider component that makes the socket object available to any child components
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null); // state for the socket object
  const { setUser } = useContext(userContext);
  const navigate = useNavigate();

  // Function to refresh the access token vwhen expired
  const refreshAccessToken = async (socket) => {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken || !socket) {
      // console.warn("Cannot refresh token: No refeshToken or socket is null.");
      // console.info("Socket:", socket);
      // console.info("refreshToken:", refreshToken);
      return null;
    }

    // Emit the refresh token event to the server via Socket.IO
    return new Promise((resolve) => {
      socket.emit("refresh_access_token", refreshToken, (response) => {
        if (response.error) {
          // console.error("Error refreshing token:", response.error);
          Cookies.remove("accessToken");
          Cookies.remove("refreshToken");
          navigate("/login"); // Redirect to login if refresh fails
        } else {
          // console.log("New access token:", response.accessToken);
          // Update the access token in cookies and resolve the new token
          Cookies.set("accessToken", response.accessToken, {
            expires: 15 / 1440, // Token expires in 15 minutes
          });
          resolve(response.accessToken);
        }
      });
    });
  };

  // Create a new socket connection when the component mounts
  useEffect(() => {
    const accessToken = Cookies.get("accessToken"); // get the token from cookies
    let newSocket;

    const authorizedPage = window.location.pathname === "/" ? true : false;

    newSocket = io(ENDPOINT, {
      withCredentials: true,
      auth: {
        accessToken: accessToken,
        authorizedPage: authorizedPage,
      },
    });

    // connection and disconnection event listeners
    const handleConnect = async () => {
      console.log("Connected to the server!");
      let accessToken = Cookies.get("accessToken");

      if (!accessToken) {
        const refreshToken = Cookies.get("refreshToken");

        if (refreshToken) {
          console.warn(
            "There is no accessToken in cookies, using refreshToken!"
          );

          accessToken = await refreshAccessToken(newSocket); // try to get a new accessToken
        }
      }

      if (accessToken) {
        const decoded = jwtDecode(accessToken);
        console.log("There is an access token!", decoded);

        setUser(decoded);
        navigate("/main"); // skip sign-in page
      } else {
        navigate("/"); // go to sign in page
      }
    };

    const handleDisconnect = () => {
      console.log("Disconnected from the server!");
    };

    // Handle token expiration
    const checkTokenExpiration = async () => {
      let accessToken = Cookies.get("accessToken");
      // console.log("Checking expiration of accesssToken!");
      if (accessToken && isTokenExpiringSoon(accessToken)) {
        // console.warn("Expiring soon, getting new token!");
        const newAccessToken = await refreshAccessToken(newSocket);
        if (newAccessToken) {
          // Re-authenticate socket with new access token
          newSocket.auth = { accessToken: newAccessToken };
          newSocket.connect(); // Reconnect with new access token
        }
      }
    };

    // Listen for token expiration event from the server
    newSocket.on("token_expired", async () => {
      console.warn("Access token expired!");
      const newAccessToken = await refreshAccessToken(newSocket);
      if (newAccessToken) {
        // Re-authenticate socket with the new access token
        newSocket.auth = { accessToken: newAccessToken };
        newSocket.connect(); // Reconnect with new access token
      }
    });

    newSocket.on("connect", handleConnect); // Listen for the connect event
    newSocket.on("disconnect", handleDisconnect); // Listen for the disconnect event

    setSocket(newSocket); // Set the socket object in the state

    // Check token expiration periodically
    const intervalId = setInterval(checkTokenExpiration, 10000); // Check every 10 seconds

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      clearInterval(intervalId);
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

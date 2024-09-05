import { useState, useEffect, createContext, useContext } from "react";
import { useSocket } from "./SocketContext"; // Import the SocketContext
import { usernameContext } from "../App";

const palettes = {
  purple: {
    messageBubble:
      "bg-gradient-to-br from-purple-600 to-indigo-500 border-gray-200 text-white",
    send: "bg-purple-500 text-white hover:bg-purple-400",
    sideBar:
      "text-white bg-gradient-to-br from-indigo-700 to-purple-700 to-70%",
    sideBarHover: "hover:bg-indigo-600",
    menu: "bg-indigo-400",
    menuNav: "bg-indigo-500",
    menuNavHover: "hover:bg-indigo-600",
    createRoomHover: "hover:bg-purple-600",
    scrollBottom: "text-purple-500 border-2 border-purple-500",
    scrollBottomHover: "hover:bg-purple-500 hover:text-white",
  },
  orange: {
    messageBubble:
      "bg-gradient-to-br from-amber-400 to-orange-400 border-gray-200 text-gray-100",
    send: "bg-orange-400 text-white hover:bg-amber-400",
    sideBar: "text-white bg-gradient-to-br from-orange-500 to-amber-500 to-70%",
    sideBarHover: "hover:bg-amber-600",
    menu: "bg-amber-500",
    menuNav: "bg-amber-500",
    menuNavHover: "hover:bg-amber-600",
    createRoomHover: "hover:bg-orange-600",
    scrollBottom: "text-orange-400 border-2 border-orange-400",
    scrollBottomHover: "hover:bg-orange-400 hover:text-white",
  },
  green: {
    messageBubble:
      "bg-gradient-to-br from-green-500 to-emerald-500 border-gray-200 text-white",
    send: "bg-emerald-500 text-white hover:bg-green-400",
    sideBar: "text-white bg-gradient-to-br from-emerald-500 to-teal-500 to-70%",
    sideBarHover: "hover:bg-green-600",
    menu: "bg-emerald-500",
    menuNav: "bg-emerald-500",
    menuNavHover: "hover:bg-green-600",
    createRoomHover: "hover:bg-green-600",
    scrollBottom: "text-green-500 border-2 border-green-500",
    scrollBottomHover: "hover:bg-green-500 hover:text-white",
  },
};

const PaletteContext = createContext();

export const usePalette = () => {
  return useContext(PaletteContext);
};

export const PaletteProvider = ({ children }) => {
  const [palette, setPalette] = useState(palettes.purple); // Default palette
  const socket = useSocket(); // Use the socket from the context
  const { username } = useContext(usernameContext); // Get the username from the context to check if the user is logged in

  const togglePalette = (colour) => {
    setPalette(palettes[colour]);
  };

  useEffect(() => {
    if (socket && socket.connected && username) {
      console.log("Fetching palette for user: ", username);
      socket.emit("fetch_palette", username); // Request the user's palette from the server

      socket.on("users_palette", (usersPalette) => {
        setPalette(palettes[usersPalette]); // Set the palette based on server response
      });

      return () => {
        socket.off("users_palette"); // Clean up listener when the component unmounts
      };
    }
  }, [socket, username]);

  return (
    <PaletteContext.Provider value={{ palette, setPalette, togglePalette }}>
      {children}
    </PaletteContext.Provider>
  );
};

import { usePalette } from "../../context/PaletteContext";
import { useSocket } from "../../context/SocketContext";
import { usernameContext } from "../../App";
import { useContext } from "react";

function ThemeMenu() {
  const { togglePalette } = usePalette(); // Destructure toggleTheme from usePalette
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { username } = useContext(usernameContext); // Get the username from the context

  const handleThemeChange = (colour) => {
    togglePalette(colour); // Call the toggleTheme function with the new theme name
    socket.emit("set_palette", username, colour); // Emit a "set_palette" event to store users selected palette in the database
  };

  return (
    <div className="text-gray-200 w-72 h-80 mx-auto rounded-xl shadow-2xl">
      <div className="flex justify-center p-5">
        <h5 className="font-bold" style={{ fontSize: "1rem" }}>
          Change the theme.
        </h5>
      </div>
      <div className="flex justify-center p-5 space-x-4">
        <button
          className="bg-gradient-to-br from-indigo-700 to-purple-700 to-70% w-20 h-10 rounded-lg"
          onClick={() => handleThemeChange("purple")}
        >
          Elixer
        </button>

        <button
          className="bg-gradient-to-br from-orange-500 to-amber-500 to-70% w-20 h-10 rounded-lg"
          onClick={() => handleThemeChange("orange")}
        >
          Sunny Day
        </button>
        <button
          className="bg-gradient-to-br from-emerald-500 to-teal-500 to-70% w-20 h-10 rounded-lg"
          onClick={() => handleThemeChange("green")}
        >
          Forest Green
        </button>
      </div>
    </div>
  );
}

export default ThemeMenu;

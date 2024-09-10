import { usePalette } from "../../context/PaletteContext";
import { useSocket } from "../../context/SocketContext";
import { userContext } from "../../App";
import { useContext } from "react";

function ThemeMenu() {
  const { togglePalette, palette } = usePalette(); // Destructure toggleTheme from usePalette
  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { user } = useContext(userContext); // Get the user from the context

  const username = user.username; // Get the username from the context

  const handleThemeChange = (colour) => {
    togglePalette(colour); // Call the toggleTheme function with the new theme name
    console.log(palette);
    socket.emit("set_palette", username, colour); // Emit a "set_palette" event to store users selected palette in the database
  };

  return (
    <div className="text-gray-200 w-full h-80 mx-auto rounded-xl shadow-2xl">
      <div className="flex justify-center p-5">
        <h5 className="font-bold" style={{ fontSize: "1rem" }}>
          Change the theme.
        </h5>
      </div>

      {/* Container for the theme buttons */}
      <div className="flex justify-center p-5 space-x-8">
        {/* Theme Option 1 - Elixer */}
        <div className="flex flex-col items-center">
          <button
            className={`bg-gradient-to-br from-indigo-700 to-purple-700 to-70% p-4 rounded-full transition-colors duration-300 ${
              palette.name === "Elixer" ? "border-2 border-white" : ""
            }`}
            onClick={() => handleThemeChange("purple")}
          ></button>
          <p className={`mt-2 ${palette.name === "Elixer" ? "font-bold" : ""}`}>
            Elixer
          </p>
        </div>

        {/* Theme Option 2 - Amber */}
        <div className="flex flex-col items-center">
          <button
            className={`bg-gradient-to-br from-orange-500 to-amber-500 to-70% p-4 rounded-full transition-colors duration-300 ${
              palette.name === "Amber" ? "border-2 border-white" : ""
            }`}
            onClick={() => handleThemeChange("orange")}
          ></button>
          <p className={`mt-2 ${palette.name === "Amber" ? "font-bold" : ""}`}>
            Amber
          </p>
        </div>

        {/* Theme Option 3 - Emerald */}
        <div className="flex flex-col items-center">
          <button
            className={`bg-gradient-to-br from-emerald-500 to-teal-500 to-70% p-4 rounded-full transition-colors duration-300 ${
              palette.name === "Emerald" ? "border-2 border-white" : ""
            }`}
            onClick={() => handleThemeChange("green")}
          ></button>
          <p
            className={`mt-2 ${palette.name === "Emerald" ? "font-bold" : ""}`}
          >
            Emerald
          </p>
        </div>
      </div>
    </div>
  );
}

export default ThemeMenu;

import { useState, useEffect, useContext } from "react";
import CreateRoom from "./menu/CreateRoom";
import ThemeMenu from "./menu/ThemeMenu";
import LogoutMenu from "./menu/LogoutMenu";
import Profile from "./menu/Profile";

// context imports
import { useSocket } from "../context/SocketContext";
import { usePalette } from "../context/PaletteContext";
import { userContext } from "../context/UserContext";

function Menu({ showMenu, setShowMenu, rooms, openChat }) {
  const [currentMenu, setCurrentMenu] = useState("profile");
  const [menuHeight, setMenuHeight] = useState(27);
  const [zIndexVisible_gcName, setZIndexVisible_gcName] = useState(false);

  const socket = useSocket(); // Use custom hook to get the socket object from the context
  const { palette } = usePalette(); // Destructure palette from usePalette
  const { user } = useContext(userContext); // Get the user from the context

  const username = user.username; // Get the username from the context

  const openMenu = (menu) => {
    setCurrentMenu(menu);
  };

  // useEffect to set the z-index of the menu to 10 when the menu is expanded for create room
  useEffect(() => {
    if (menuHeight > 27) {
      const timer = setTimeout(() => {
        setZIndexVisible_gcName(true);
      }, 300); // 300ms delay
      return () => clearTimeout(timer);
    } else {
      setZIndexVisible_gcName(false);
    }
  }, [menuHeight]);

  return (
    <div
      className={`absolute md:left-[20.3rem] left-[2rem] md:top-1 top-[3.5rem] ${palette.menu} w-80 mx-auto mt-3 rounded-xl md:opacity-90 md:shadow-sm shadow-2xl transition-all ease-in-out duration-300
    md:hover:shadow-2xl hover:opacity-100`}
      style={{ height: `${menuHeight}rem`, zIndex: 9999 }}
    >
      <div className="flex justify-center">
        <h5
          className="font-bold text-white pt-5"
          style={{ fontSize: "1.4rem" }}
        >
          Menu
        </h5>
      </div>

      {/* Each menu conditionally rendered */}
      <div
        className={`flex flex-col h-full w-full relative transition-all duration-300 ${
          zIndexVisible_gcName ? "" : "z-10"
        }`}
      >
        {currentMenu === "createRoom" && (
          <CreateRoom
            username={username}
            rooms={rooms}
            openChat={openChat}
            setShowMenu={setShowMenu}
            menuHeight={menuHeight}
            setMenuHeight={setMenuHeight}
          />
        )}
        {currentMenu === "profile" && <Profile />}
        {currentMenu === "theme" && <ThemeMenu />}
        {currentMenu === "logout" && <LogoutMenu />}
      </div>

      {/* Bottom bar */}
      <div
        className={`bottomBar ${palette.menuNav} rounded-b-xl absolute bottom-0 w-full h-11 transition-color ease-in-out duration-300 grid grid-cols-4`}
        style={{ zIndex: 9999 }}
      >
        <div
          className={`flex items-center justify-center rounded-bl-xl ${palette.menuNavHover}`}
          onClick={() => openMenu("profile")}
        >
          <img
            src={`${
              currentMenu === "profile" ? "profile_selected.png" : "profile.png"
            }`}
            alt="Profile"
            className="w-7 invert"
          />
        </div>
        <div
          className={`flex items-center justify-center ${palette.menuNavHover}`}
          onClick={() => openMenu("createRoom")}
        >
          <img
            src={`${
              currentMenu === "createRoom"
                ? "create_room_active.png"
                : "add_icon.png"
            }`}
            alt="Create Room"
            className={`w-7 ${currentMenu === "createRoom" && "invert"}`}
          />
        </div>
        <div
          className={`flex items-center justify-center ${palette.menuNavHover}`}
          onClick={() => openMenu("theme")}
        >
          <img
            src={`${
              currentMenu === "theme" ? "theme_active.png" : "theme.png"
            }`}
            alt="Theme"
            className="w-7 invert"
          />
        </div>
        <div
          className={`flex items-center justify-center rounded-br-xl ${palette.menuNavHover}`}
          onClick={() => openMenu("logout")}
        >
          <img
            src={`${
              currentMenu === "logout" ? "logout_active.png" : "logout.png"
            }`}
            alt="Logout"
            className="w-7 invert"
          />
        </div>
      </div>
    </div>
  );
}

export default Menu;

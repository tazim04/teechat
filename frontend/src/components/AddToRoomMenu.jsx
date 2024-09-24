import { React, useState, useContext } from "react";
import { userContext } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";
import { usePalette } from "../context/PaletteContext";
import { allUsersContext } from "../context/AllUsersContext";

function AddToRoomMenu() {
  const { user } = useContext(userContext);
  const socket = useSocket();
  const { palette } = usePalette();
  const { allUsers } = useContext(allUsersContext);

  return (
    <div>
      <h1>Add to Room</h1>
    </div>
  );
}

export default AddToRoomMenu;

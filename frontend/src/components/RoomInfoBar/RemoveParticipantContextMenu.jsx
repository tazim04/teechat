import { useSocket } from "../../context/SocketContext";
import { useState, useContext } from "react";
import { isDeleteOpenContext } from "./SideBar";

function RemoveParticipantContextMenu({ setShowContextMenu }) {
  const socket = useSocket(); // Use custom hook to get the socket object from the context

  const openRemoveParticipantModal = () => {
    return;
  };

  return (
    <div>
      <h1>Remove Participant</h1>
    </div>
  );
}

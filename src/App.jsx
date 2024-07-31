import { useEffect, useState } from "react";
import "./App.css";
import { SocketProvider } from "./context/SocketContext.jsx";
import Chat from "./pages/Chat.jsx";
import { io } from "socket.io-client";

function App() {
  return (
    <SocketProvider>
      <Chat />
    </SocketProvider>
  );
}

export default App;

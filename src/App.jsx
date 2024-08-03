import { useEffect, useState, createContext } from "react";
import "./App.css";
import { SocketProvider } from "./context/SocketContext.jsx";
import Chat from "./pages/Chat.jsx";
import MainPage from "./pages/MainPage.jsx";
import SignIn from "./pages/SignIn.jsx";
import { io } from "socket.io-client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const [username, setUsername] = useState(""); // State for the username

  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={<SignIn username={username} setUsername={setUsername} />}
          />
          <Route path="/main" element={<MainPage username={username} />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;

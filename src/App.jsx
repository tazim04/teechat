import { useEffect, useState, createContext } from "react";
import "./App.css";
import { SocketProvider } from "./context/SocketContext.jsx";
import Chat from "./pages/Chat.jsx";
import MainPage from "./pages/MainPage.jsx";
import SignIn from "./pages/SignIn.jsx";
import CreateAccount from "./pages/CreateAccount.jsx";
import { io } from "socket.io-client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

export const onlineUsersContext = createContext({}); // Create a context for the users online

function App() {
  const [username, setUsername] = useState(""); // State for the username
  const [password, setPassword] = useState(""); // State for the password
  const [onlineUsers, setOnlineUsers] = useState([]); // State for the users online

  return (
    <SocketProvider>
      <onlineUsersContext.Provider value={{ onlineUsers, setOnlineUsers }}>
        <Router>
          <Routes>
            {/* Redirect "/" to "/sign-in" */}
            <Route path="/" element={<Navigate to="/sign-in" replace />} />
            <Route
              path="/sign-in"
              element={
                <SignIn setUsername={setUsername} setPassword={setPassword} />
              }
            />
            <Route
              path="/create-account"
              element={
                <CreateAccount
                  setUsername={setUsername}
                  setPassword={setPassword}
                />
              }
            />
            <Route path="/main" element={<MainPage username={username} />} />
          </Routes>
        </Router>
      </onlineUsersContext.Provider>
    </SocketProvider>
  );
}

export default App;

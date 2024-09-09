import { useEffect, useState, createContext } from "react";
import "./App.css";
import { SocketProvider } from "./context/SocketContext.jsx";
import { PaletteProvider } from "./context/PaletteContext.jsx";
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

export const onlineUsersContext = createContext([]); // Create a context for the users online
export const allUsersContext = createContext([]); // Create a context for all users in the database
export const usernameContext = createContext(""); // Create a context for the username for easy access across components

function App() {
  const [username, setUsername] = useState(""); // State for the username
  const [password, setPassword] = useState(""); // State for the password
  const [onlineUsers, setOnlineUsers] = useState([]); // State for the users online
  const [allUsers, setAllUsers] = useState([]); // State for all users in the database

  return (
    <SocketProvider>
      <usernameContext.Provider value={{ username, setUsername }}>
        <PaletteProvider>
          <onlineUsersContext.Provider value={{ onlineUsers, setOnlineUsers }}>
            <allUsersContext.Provider value={{ allUsers, setAllUsers }}>
              <Router>
                <Routes>
                  {/* Redirect "/" to "/sign-in" */}
                  <Route
                    path="/"
                    element={<Navigate to="/sign-in" replace />}
                  />
                  <Route
                    path="/sign-in"
                    element={<SignIn setPassword={setPassword} />}
                  />
                  <Route
                    path="/create-account"
                    element={<CreateAccount setPassword={setPassword} />}
                  />
                  <Route path="/main" element={<MainPage />} />
                </Routes>
              </Router>
            </allUsersContext.Provider>
          </onlineUsersContext.Provider>
        </PaletteProvider>
      </usernameContext.Provider>
    </SocketProvider>
  );
}

export default App;

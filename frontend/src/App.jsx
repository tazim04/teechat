import { useEffect, useState, createContext } from "react";
import "./App.css";
import { SocketProvider } from "./context/SocketContext.jsx";
import { PaletteProvider } from "./context/PaletteContext.jsx";
import Chat from "./pages/Chat.jsx";
import MainPage from "./pages/MainPage.jsx";
import SignIn from "./pages/SignIn.jsx";
import CreateAccount from "./pages/CreateAccount.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import { io } from "socket.io-client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

export const onlineUsersContext = createContext([]); // Create a context for the users online
export const allUsersContext = createContext([]); // Create a context for all users in the database
export const userContext = createContext({}); // Create a context for the user info for easy access across components

function App() {
  const [user, setUser] = useState({}); // State for the user info
  const [password, setPassword] = useState(""); // State for the password
  const [onlineUsers, setOnlineUsers] = useState([]); // State for the users online
  const [allUsers, setAllUsers] = useState([]); // State for all users in the database

  return (
    <SocketProvider>
      <userContext.Provider value={{ user, setUser }}>
        <PaletteProvider>
          <onlineUsersContext.Provider value={{ onlineUsers, setOnlineUsers }}>
            <allUsersContext.Provider value={{ allUsers, setAllUsers }}>
              <Router>
                <Routes>
                  {/* Redirect "/" to "/sign-in" */}
                  <Route
                    path="/"
                    element={<LandingPage setPassword={setPassword} />}
                  />
                  <Route path="/main" element={<MainPage />} />
                </Routes>
              </Router>
            </allUsersContext.Provider>
          </onlineUsersContext.Provider>
        </PaletteProvider>
      </userContext.Provider>
    </SocketProvider>
  );
}

export default App;

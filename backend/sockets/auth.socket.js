import Users from "../models/users.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../services/token.service.js";
import jwt from "jsonwebtoken";

export default function authSocket(socket) {
  // Handle user sign-in
  socket.on("sign_in", async (username, password) => {
    try {
      const user = await Users.findOne({ username });
      if (!user) {
        console.log("sign_in: user not found", username);
        return socket.emit("sign_in_response", {
          success: false,
        });
      }

      const passwordMatch = await user.comparePassword(password);

      // Invalid password
      if (!passwordMatch)
        return socket.emit("sign_in_response", { success: false });

      // Successful login
      // Return user data without password and generate tokens
      const { password: _p, ...safeUser } = user.toObject();
      const accessToken = generateAccessToken(safeUser);
      const refreshToken = generateRefreshToken(safeUser);

      socket.emit("sign_in_response", {
        success: true,
        user: safeUser,
        accessToken,
        refreshToken,
      });
    } catch (e) {
      console.error("sign_in error", e);
      socket.emit("sign_in_response", { success: false });
    }
  });

  // Handle access token refresh
  socket.on("refresh_access_token", (refreshToken, callback) => {
    if (!refreshToken) return callback({ error: "Refresh token required" });

    // Verify the refresh token and generate a new access token
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
      if (err) return callback({ error: "Invalid refresh token" });
      const { exp, iat, ...safeUser } = user; // remove the JWT specific fields, new ones will be generated
      const newAccess = generateAccessToken(safeUser);
      callback({ accessToken: newAccess }); // return the new access token
    });
  });

  // Handle account creation
  socket.on(
    "create_account",
    async (email, username, password, birthday, interests, socials) => {
      const existing_email = await Users.findOne({ email });
      const existing_username = await Users.findOne({ username });

      // Check if email or username already exists
      if (existing_email)
        return socket.emit("account_created", {
          success: false,
          reason: "email",
        });
      if (existing_username)
        return socket.emit("account_created", {
          success: false,
          reason: "username",
        });

      // Create and save the new user
      const user = new Users({
        email,
        username,
        rooms: [],
        password,
        birthday,
        interests,
        socials,
      });
      try {
        await user.save();
        const { password: _p, ...safeUser } = user.toObject();
        const accessToken = generateAccessToken(safeUser);
        const refreshToken = generateRefreshToken(safeUser);
        socket.emit("account_created", {
          success: true,
          user: safeUser,
          accessToken,
          refreshToken,
        });
      } catch (e) {
        console.error("create_account error", e);
        socket.emit("account_created", null);
      }
    }
  );
}

import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export function socketAuth(io) {
  io.use((socket, next) => {
    const { accessToken, authorizedPage } = socket.handshake.auth || {};

    // if the page is authorized, let it connect (login or signup)
    if (authorizedPage) return next();

    if (!accessToken)
      return next(new Error("Authentication error: access token is required")); // Reject connection without token

    jwt.verify(accessToken, env.jwtSecret, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          socket.emit("token_expired"); // Notify the client to refresh the token
          return next(new Error("Authentication error: token expired"));
        }
        return next(new Error("Authentication error: invalid token"));
      }
      socket.user = decoded; // Attach decoded user to socket
      next();
    });
  });
}

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// JWT Token generation
export const generateAccessToken = (user) =>
  jwt.sign(user, env.jwtSecret, { expiresIn: "15m" });

export const generateRefreshToken = (user) =>
  jwt.sign(user, env.jwtSecret, { expiresIn: "7d" });

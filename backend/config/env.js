import dotenv from "dotenv";
import assert from "node:assert";

dotenv.config();

const required = ["MONGODB_URI", "JWT_SECRET", "CLIENT_ORIGINS"];
required.forEach((k) => assert(process.env[k], `Missing env ${k}`));

export const env = {
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientOrigins: process.env.CLIENT_ORIGINS.split(",").map((s) => s.trim()),
};

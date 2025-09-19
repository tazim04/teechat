import http from "node:http";
import { Server as IOServer } from "socket.io";
import { env } from "./config/env.js";
import { connectMongo } from "./config/db.js";
import app from "./app.js";
import { registerSocket } from "./sockets/index.js";

await connectMongo(env.mongoUri);

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

registerSocket(io);

server.listen(3000, () => {
  console.log("Listening on port 3000");
});

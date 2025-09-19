import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use("/api", apiRoutes);

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

export default app;

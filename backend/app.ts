// Express app: JSON body parsing, mounts every /api route, and serves the built frontend (dist/) in production.

import express from "express";
import { leaderboardRouter } from "./routes/leaderboard";

export const app = express();
app.use(express.json());

app.use("/api/leaderboard", leaderboardRouter);
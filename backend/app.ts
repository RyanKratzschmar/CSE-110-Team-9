// Express app: JSON body parsing and API routes.
import express from "express";
import { runsRouter } from "./routes/runs";
import { restRouter } from "./routes/rest";
import { combatRouter } from "./routes/combat";
import { leaderboardRouter } from "./routes/leaderboard";

export const app = express();

app.use(express.json());
app.use("/api/runs", runsRouter);
app.use("/api/runs", restRouter);
app.use("/api/runs", combatRouter);
app.use("/api/leaderboard", leaderboardRouter);

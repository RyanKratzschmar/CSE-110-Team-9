// Express app: JSON body parsing, mounts every /api route, and serves the built frontend (dist/) in production.
import express from "express";
import { runsRouter } from "./routes/runs";
import { restRouter } from "./routes/rest";
import { combatRouter } from "./routes/combat";
export const app = express();

// Parse JSON request bodies before handling routes.
app.use(express.json());

app.use("/api/runs", runsRouter);
app.use("/api/runs", restRouter);
app.use("/api/runs", combatRouter);




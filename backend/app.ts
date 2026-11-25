// Express app: JSON body parsing, mounts every /api route, and serves the built frontend (dist/) in production.

import express from "express";

export const app = express();
app.use(express.json());
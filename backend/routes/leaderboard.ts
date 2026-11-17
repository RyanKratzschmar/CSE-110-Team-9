import { Router } from "express";
import { getSortedLeaderboard, addScore } from "../game/Leaderboard/Leaderboard";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", (_req, res) => {
    res.json(getSortedLeaderboard());
});

leaderboardRouter.post("/", (req, res) => {
    const { score } = req.body;

    if (typeof score !== "number") {
        res.status(400).json({ error: "score (number) required" });
        return;
    }

    addScore({ timestamp: new Date().toISOString(), score });
    res.json({ message: "Saved" });
});
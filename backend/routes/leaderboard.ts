import { Router } from "express";
import { getSortedLeaderboard, addScore } from "../game/Leaderboard/Leaderboard";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", (_req, res) => {
    res.json(getSortedLeaderboard());
});

leaderboardRouter.post("/", (req, res) => {
    const {timestamp, score} = req.body;

    if ((typeof timestamp !== "string") || (typeof score !== "number")) {
        res.status(400).json({ error: "timestamp (string) and score (number) required" });
        return;
    }

    addScore({ timestamp, score });
    res.json({ message: "Saved" });
});
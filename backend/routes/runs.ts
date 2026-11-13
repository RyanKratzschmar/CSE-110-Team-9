// Run routes: POST /api/runs (start a game), GET /api/runs/:id (map + player state). (Sally)
import { Router } from "express";
import { runStore } from "../game/runStore";

export const runsRouter = Router();

// Start a new run with its own player and level state.
runsRouter.post("/", (_req, res) => {
    const id = runStore.create();
    const state = runStore.get(id)!;

    res.status(201).json({
        id,
        ...state.toJSON(),
    });
});

// Read an existing run without resetting its progress.
runsRouter.get("/:id", (req, res) => {
    const id = req.params.id;
    const state = runStore.get(id);

    if (!state) {
        res.status(404).json({ error: "Run not found" });
        return;
    }

    res.json({
        id,
        ...state.toJSON(),
    });
});


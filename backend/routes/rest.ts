// Rest API: entering the rest screen heals; Continue advances the level.
import { Router } from "express";
import { RestStop } from "../game/RestStop";
import { finishRest, GameFlowError, requireCurrentStop } from "../game/GameManager";
import { runStore } from "../game/runStore";

export const restRouter = Router();
const restStop = new RestStop();

// Called when the player ENTERS the rest screen.
// Mount this router at /api/runs in app.ts.
restRouter.post("/:id/rest/enter", (req, res) => {
  const state = runStore.get(req.params.id);
  if (!state) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  try {
    restStop.rest(state); // Immediately restore HP to maximum.
    res.json(state.toJSON());
  } catch (error) {
    if (error instanceof GameFlowError) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Could not enter rest" });
  }
});

// Called when the player clicks CONTINUE.
// Rest must be entered first, otherwise Continue cannot skip the heal step.
restRouter.post("/:id/rest", (req, res) => {
  const state = runStore.get(req.params.id);
  if (!state) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  try {
    requireCurrentStop(state, "rest");
    if (!restStop.hasEntered(state)) {
      res.status(409).json({ error: "Enter rest before continuing" });
      return;
    }
    finishRest(state);
    restStop.leave(state);
    res.json(state.toJSON());
  } catch (error) {
    if (error instanceof GameFlowError) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Could not continue from rest" });
  }
});

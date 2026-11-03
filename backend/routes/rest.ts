/**
 * HTTP endpoints for the Rest step of a game run.
 *
 * The two actions are intentionally separate
 *   POST /api/runs/:id/rest/enter  -> enter Rest and heal immediately
 *   POST /api/runs/:id/rest        -> click Continue and advance the level
 *
 * The parent Express app must mount restRouter under "/api/runs".
 * This file translates browser/API requests into game logic; it does not
 * calculate HP itself or choose what the next level looks like.
 */
import { Router } from "express";
import { RestStop } from "../game/RestStop";
import { finishRest, GameFlowError, requireCurrentStop } from "../game/GameManager";
import { runStore } from "../game/runStore";

export const restRouter = Router();
// Share one RestStop instance across both routes so the Enter flag persists.
const restStop = new RestStop();

/**
 * ENTER REST: called when the game opens the Rest screen.
 * The :id in the URL identifies which game session should be healed.
 * Success: returns the latest GameState JSON with full player HP.
 */
restRouter.post("/:id/rest/enter", (req, res) => {
  // Look up the existing game instead of making a new one.
  const state = runStore.get(req.params.id);
  if (!state) {
    // The URL contained a run ID that does not exist.
    res.status(404).json({ error: "Run not found" });
    return;
  }

  try {
    // RestStop checks that we are at a rest node and heals the same Player.
    // It also records that Continue is now allowed for this game.
    restStop.rest(state);
    res.json(state.toJSON());
  } catch (error) {
    if (error instanceof GameFlowError) {
      // Example: trying to rest during combat or after game over.
      res.status(409).json({ error: error.message });
      return;
    }
    // Unexpected failures get a generic response rather than exposing internals.
    res.status(500).json({ error: "Could not enter rest" });
  }
});

/**
 * CONTINUE: called when the player presses Continue on the Rest screen.
 * The player has already been healed by the /rest/enter request.
 * Success: GameManager moves to the next level and sends its new state.
 */
restRouter.post("/:id/rest", (req, res) => {
  const state = runStore.get(req.params.id);
  if (!state) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  try {
    // Reject Continue outside a Rest node, including repeat clicks after
    // advancing: GameManager knows the current node and game-over status.
    requireCurrentStop(state, "rest");
    if (!restStop.hasEntered(state)) {
      // The game must call /rest/enter before Continue, even when HP is full.
      res.status(409).json({ error: "Enter rest before continuing" });
      return;
    }
    // Sally's GameManager marks Rest complete and creates the next level.
    finishRest(state);
    // Clear this run's Rest flag only AFTER a successful level transition.
    restStop.leave(state);
    // Return updated level/HP data for the frontend to display later.
    res.json(state.toJSON());
  } catch (error) {
    if (error instanceof GameFlowError) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Could not continue from rest" });
  }
});

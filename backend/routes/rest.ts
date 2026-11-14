import { Router } from "express";
import { RestStop } from "../game/RestStop";
import { RestMenu, InvalidRestOptionError } from "../game/RestMenu";
import { GameFlowError } from "../game/GameManager";
import { runStore } from "../game/runStore";

export const restRouter = Router();

// Share these objects so the same run keeps its Rest entry status.
const restStop = new RestStop();
const restMenu = new RestMenu(restStop);

// Enter Rest and heal the player to full HP.
restRouter.post("/:id/rest/enter", (req, res) => {
  const state = runStore.get(req.params.id);
  if (!state) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  try {
    restStop.rest(state);
    res.json(state.toJSON());
  } catch (error) {
    if (error instanceof GameFlowError) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Could not enter rest" });
  }
});

// Get the three Rest menu options.
restRouter.get("/:id/rest/menu", (req, res) => {
  const state = runStore.get(req.params.id);
  if (!state) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  try {
    res.json({ options: restMenu.getOptions(state) });
  } catch (error) {
    if (error instanceof GameFlowError) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Could not get Rest menu" });
  }
});

// Choose Upgrade, Potions, or Leave Rest.
restRouter.post("/:id/rest/menu/select", (req, res) => {
  const state = runStore.get(req.params.id);
  if (!state) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  try {
    const screen = restMenu.selectOption(state, req.body?.option);
    res.json({ screen, state: state.toJSON() });
  } catch (error) {
    if (error instanceof InvalidRestOptionError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof GameFlowError) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Could not select Rest menu option" });
  }
});

// Keep the Task 1 Continue API working for existing callers.
restRouter.post("/:id/rest", (req, res) => {
  const state = runStore.get(req.params.id);
  if (!state) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  try {
    restMenu.leaveRest(state);
    res.json(state.toJSON());
  } catch (error) {
    if (error instanceof GameFlowError) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Could not continue from rest" });
  }
});

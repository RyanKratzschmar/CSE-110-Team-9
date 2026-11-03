/**
 * runStore is the shared, in-memory collection of active game sessions.
 *
 * One game session is called a "run". Each run has a unique string ID and
 * its own GameState (player HP, level, game-over state, etc.). Routes use
 * the same run ID to find and update the same game across API requests.
 */
import { randomUUID } from "node:crypto";
import { GameState } from "./GameState";

// Map keys are run IDs; Map values are their matching, mutable GameState objects.
const runs = new Map<string, GameState>();

export const runStore = {
  /**
   * Create a new game session.
   * randomUUID() gives it a unique ID so two players/runs do not share data.
   * Save a new GameState under that ID and return the ID to the caller.
   */
  create(): string {
    const id = randomUUID();
    runs.set(id, new GameState());
    return id;
  },

  /**
   * Find the GameState belonging to an existing run ID.
   * Returns the SAME object stored in the Map, not a copy. For example,
   * healing a player through this object will also be visible when Combat
   * later looks up the same run ID.
   * Returns undefined for an unknown ID; API routes should reply with 404.
   */
  get(id: string): GameState | undefined {
    return runs.get(id);
  },
};

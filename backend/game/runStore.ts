// runStore keeps each game's state in memory using a unique run ID.
// NOTE: Data disappears when the server restarts (fine for Sprint 1).
import { randomUUID } from "node:crypto";
import { GameState } from "./GameState";

const runs = new Map<string, GameState>();

export const runStore = {
  // Start a new game and return its ID.
  create(): string {
    const id = randomUUID();
    runs.set(id, new GameState());
    return id;
  },

  // Find a game. An unknown ID returns undefined.
  get(id: string): GameState | undefined {
    return runs.get(id);
  },
};

// GameManager: game flow: what happens after a win, a loss, or a rest, and when the next (harder) level starts. (Sally)
import type { GameState } from "./GameState";
import { Level } from "./Level";
import type { LevelNode, NodeType } from "./LevelNode";

// Thrown when an action doesn't fit the current stop type; routes can turn it into a 409 response
export class GameFlowError extends Error {}

// Checks the player is at the right kind of stop and returns it
export function requireCurrentStop(state: GameState, type: NodeType): LevelNode {
  if (state.gameOver) throw new GameFlowError("The game is over");
  const node = state.level.currentNode();
  if (!node || node.type !== type) {
    throw new GameFlowError(`The current stop is not a ${type} stop`);
  }
  return node;
}

// Called by the COMBAT route when a fight ends
export function finishCombat(state: GameState, result: "win" | "lose"): void {
  requireCurrentStop(state, "combat");
  if (result === "lose") {
    state.gameOver = true;
    return;
  }
  state.level.completeCurrent();
}

// Called by the REST route after the player is done with it, and decides to CONTINUE
//saving is not implemented in Sprint 1 yet, so rest would call this function only for now
export function finishRest(state: GameState): void {
  requireCurrentStop(state, "rest");
  state.level.completeCurrent();
  state.level = new Level(state.level.number + 1);
}

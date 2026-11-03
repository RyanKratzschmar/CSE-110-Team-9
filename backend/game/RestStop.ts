// RestStop: restores the player's health when they enter a rest stop.
import type { GameState } from "./GameState";
import { requireCurrentStop } from "./GameManager";

export class RestStop {
  // Tracks which runs have entered the Rest screen.
  private enteredRuns = new WeakSet<GameState>();

  // Only allow resting at a rest node, while the game is active.
  rest(state: GameState): void {
    requireCurrentStop(state, "rest");
    state.player.healFull();
    this.enteredRuns.add(state);
  }

  // Continue is only available after entering the rest screen.
  hasEntered(state: GameState): boolean {
    return this.enteredRuns.has(state);
  }

  leave(state: GameState): void {
    this.enteredRuns.delete(state);
  }
}

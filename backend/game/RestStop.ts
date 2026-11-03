/**
 * RestStop handles what happens when a player ARRIVES at a rest node.
 *
 * Our Sprint 1 rule is simple: the player recovers all HP immediately.
 * This class does NOT move to the next level. That is a separate action
 * handled by GameManager.finishRest() when the player clicks Continue.
 */
import type { GameState } from "./GameState";
import { requireCurrentStop } from "./GameManager";

export class RestStop {
  /**
   * Remember which GameState objects have entered Rest.
   * A WeakSet stores object references, not run IDs; it also lets JavaScript
   * release a GameState from memory when nothing else uses it.
   * We need this flag so Continue cannot skip the Enter Rest step.
   */
  private enteredRuns = new WeakSet<GameState>();

  /**
   * Called when the player enters the Rest screen.
   *
   * 1. Verify the current node is "rest" and the game is not over.
   *    requireCurrentStop throws GameFlowError otherwise.
   * 2. Heal the EXISTING Player object to maximum HP. We do not create a
   *    new Player, so Combat and the rest of the game see the updated HP.
   * 3. Record that this game has entered Rest and may later Continue.
   *
   * No timer and no extra HP are used; Player.healFull() enforces the rule.
   */
  rest(state: GameState): void {
    requireCurrentStop(state, "rest");
    state.player.healFull();
    this.enteredRuns.add(state);
  }

  /** Return true only if this exact game has already entered Rest. */
  hasEntered(state: GameState): boolean {
    return this.enteredRuns.has(state);
  }

  /**
   * Forget that the game was in Rest after Continue succeeds.
   * This prevents an old Rest entry from being reused on a later node.
   * The level transition itself is done by GameManager, not here.
   */
  leave(state: GameState): void {
    this.enteredRuns.delete(state);
  }
}

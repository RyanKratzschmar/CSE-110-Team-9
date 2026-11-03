// Sprint 1: tests for Rest healing and game-state updates (no frontend needed).
import { describe, expect, it } from "vitest";
import { GameState } from "../backend/game/GameState";
import { RestStop } from "../backend/game/RestStop";
import { finishCombat, finishRest, GameFlowError } from "../backend/game/GameManager";
import { runStore } from "../backend/game/runStore";

// Finish three combat nodes using the same flow the combat route uses.
function reachRest(state: GameState): void {
  for (let i = 0; i < 3; i++) finishCombat(state, "win");
}

describe("RestStop: health updates", () => {
  it("heals the existing player to maximum HP immediately", () => {
    const state = new GameState();
    const player = state.player;
    player.takeDamage(40);
    expect(player.hp).toBeLessThan(player.maxHp);
    reachRest(state);

    const rest = new RestStop();
    rest.rest(state);
    expect(state.player).toBe(player); // Keep the same Player object for Combat.
    expect(state.player.hp).toBe(state.player.maxHp);
    expect(state.toJSON().player.hp).toBe(state.player.maxHp);
    expect(state.level.currentNode()?.type).toBe("rest"); // Entering does not advance.
    expect(state.level.number).toBe(1);
  });

  it("does not heal above max HP even if Rest is entered twice", () => {
    const state = new GameState();
    reachRest(state);
    const rest = new RestStop();
    rest.rest(state);
    rest.rest(state);
    expect(state.player.hp).toBe(state.player.maxHp);
  });

  it("heals correctly even when the player has only 1 HP left", () => {
    const state = new GameState();
    state.player.takeDamage(110); // Player's 10% defense means 99 damage.
    expect(state.player.hp).toBe(1);
    reachRest(state);
    new RestStop().rest(state);
    expect(state.player.hp).toBe(100);
  });

  it("does not allow healing at a combat node or after game over", () => {
    const state = new GameState();
    state.player.takeDamage(40);
    const hp = state.player.hp;
    expect(() => new RestStop().rest(state)).toThrow(GameFlowError);
    expect(state.player.hp).toBe(hp);
    reachRest(state);
    state.gameOver = true;
    expect(() => new RestStop().rest(state)).toThrow(GameFlowError);
    expect(state.player.hp).toBe(hp);
  });
});

describe("RestStop: Continue and level updates", () => {
  it("Continue advances once to the next level with full HP", () => {
    const state = new GameState();
    state.player.takeDamage(40);
    reachRest(state);
    const rest = new RestStop();
    rest.rest(state);
    expect(rest.hasEntered(state)).toBe(true);
    finishRest(state);
    rest.leave(state);

    expect(rest.hasEntered(state)).toBe(false);
    expect(state.player.hp).toBe(state.player.maxHp);
    expect(state.level.number).toBe(2);
    expect(state.level.currentIndex).toBe(0);
    expect(state.level.currentNode()?.type).toBe("combat");
    expect(state.toJSON().level).toBe(2);
    expect(() => finishRest(state)).toThrow(GameFlowError); // No double advance.
  });

  it("tracks entering Rest separately for each game", () => {
    const first = new GameState();
    const second = new GameState();
    reachRest(first);
    reachRest(second);
    const rest = new RestStop();
    rest.rest(first);
    expect(rest.hasEntered(first)).toBe(true);
    expect(rest.hasEntered(second)).toBe(false);
  });
});

describe("runStore: shared game data", () => {
  it("creates separate runs and returns the same mutable GameState", () => {
    const firstId = runStore.create();
    const secondId = runStore.create();
    const first = runStore.get(firstId);
    const second = runStore.get(secondId);
    expect(firstId).not.toBe(secondId);
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first).not.toBe(second);
    expect(runStore.get("not-a-real-id")).toBeUndefined();

    first!.player.takeDamage(40);
    expect(runStore.get(firstId)!.player.hp).toBe(first!.player.hp);
    expect(second!.player.hp).toBe(second!.player.maxHp);
    reachRest(first!);
    new RestStop().rest(first!);
    expect(runStore.get(firstId)!.player.hp).toBe(first!.player.maxHp);
    expect(runStore.get(secondId)!.level.currentIndex).toBe(0);
  });
});

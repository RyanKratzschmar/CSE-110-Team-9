/**
 * We test backend behavior directly without a browser, React, or a server.
 * Every test makes its own GameState so the tests are independent.
 */
import { describe, expect, it } from "vitest";
import { GameState } from "../backend/game/GameState";
import { RestStop } from "../backend/game/RestStop";
import { finishCombat, finishRest, GameFlowError } from "../backend/game/GameManager";
import { runStore } from "../backend/game/runStore";

/**
 * A level contains 3 Combat nodes followed by one Rest node.
 * This helper simulates three victories using the real GameManager flow,
 * so each Rest test starts on a valid Rest node without needing monsters.
 */
function reachRest(state: GameState): void {
  for (let i = 0; i < 3; i++) finishCombat(state, "win");
}

describe("RestStop: health updates", () => {
  it("heals the existing player to maximum HP immediately", () => {
    const state = new GameState();
    const player = state.player;
    // First damage the player so there is HP to recover.
    player.takeDamage(40);
    expect(player.hp).toBeLessThan(player.maxHp);
    reachRest(state);

    const rest = new RestStop();
    rest.rest(state);
    // Healing changes the existing object, not the player reference.
    expect(state.player).toBe(player);
    expect(state.player.hp).toBe(state.player.maxHp);
    // The API-facing state reports the same HP that game logic uses.
    expect(state.toJSON().player.hp).toBe(state.player.maxHp);
    // Entering Rest alone must NOT complete Rest or advance the level.
    expect(state.level.currentNode()?.type).toBe("rest");
    expect(state.level.number).toBe(1);
  });

  it("does not heal above max HP even if Rest is entered twice", () => {
    const state = new GameState();
    reachRest(state);
    const rest = new RestStop();
    // Repeated calls must not increase HP beyond the maximum.
    rest.rest(state);
    rest.rest(state);
    expect(state.player.hp).toBe(state.player.maxHp);
  });

  it("heals correctly even when the player has only 1 HP left", () => {
    const state = new GameState();
    // Player has 10% defense, so 110 raw damage becomes 99 HP lost.
    state.player.takeDamage(110);
    expect(state.player.hp).toBe(1);
    reachRest(state);
    new RestStop().rest(state);
    // HP recovery happens immediately, even from very low health.
    expect(state.player.hp).toBe(100);
  });

  it("does not allow healing at a combat node or after game over", () => {
    const state = new GameState();
    state.player.takeDamage(40);
    const hp = state.player.hp;
    // A new game starts at Combat, so resting must be rejected.
    expect(() => new RestStop().rest(state)).toThrow(GameFlowError);
    expect(state.player.hp).toBe(hp);
    reachRest(state);
    // Even on a Rest node, a finished game may not heal.
    state.gameOver = true;
    expect(() => new RestStop().rest(state)).toThrow(GameFlowError);
    // A rejected action must leave HP unchanged.
    expect(state.player.hp).toBe(hp);
  });
});

describe("RestStop: Continue and level updates", () => {
  it("Continue advances once to the next level with full HP", () => {
    const state = new GameState();
    state.player.takeDamage(40);
    reachRest(state);
    const rest = new RestStop();
    // Enter Rest restores HP and marks Continue as allowed.
    rest.rest(state);
    expect(rest.hasEntered(state)).toBe(true);
    // Mimic the Continue API route: advance, then clear the entry flag.
    finishRest(state);
    rest.leave(state);

    expect(rest.hasEntered(state)).toBe(false);
    expect(state.player.hp).toBe(state.player.maxHp);
    // The next level starts at its first Combat node.
    expect(state.level.number).toBe(2);
    expect(state.level.currentIndex).toBe(0);
    expect(state.level.currentNode()?.type).toBe("combat");
    expect(state.toJSON().level).toBe(2);
    // Trying to advance again outside Rest must fail.
    expect(() => finishRest(state)).toThrow(GameFlowError);
  });

  it("tracks entering Rest separately for each game", () => {
    const first = new GameState();
    const second = new GameState();
    reachRest(first);
    reachRest(second);
    const rest = new RestStop();
    // Entering one run must not unlock Continue for another run.
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
    // Each new game has a different ID and a different GameState object.
    expect(firstId).not.toBe(secondId);
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first).not.toBe(second);
    expect(runStore.get("not-a-real-id")).toBeUndefined();

    // Updating run 1 must be visible through the store, not affect run 2.
    first!.player.takeDamage(40);
    expect(runStore.get(firstId)!.player.hp).toBe(first!.player.hp);
    expect(second!.player.hp).toBe(second!.player.maxHp);
    reachRest(first!);
    new RestStop().rest(first!);
    expect(runStore.get(firstId)!.player.hp).toBe(first!.player.maxHp);
    expect(runStore.get(secondId)!.level.currentIndex).toBe(0);
  });
});

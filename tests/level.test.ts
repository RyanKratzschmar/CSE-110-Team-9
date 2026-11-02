// Tests 3 combats per level, rest at the end, no skipping stops, next level after rest, game over on loss. (Sally)
import { describe, expect, it } from "vitest";
import { FIGHTS_PER_LEVEL, Level } from "../backend/game/Level";
import { LevelNode } from "../backend/game/LevelNode";

import { finishCombat, finishRest, GameFlowError, requireCurrentStop } from "../backend/game/GameManager";
import { GameState } from "../backend/game/GameState";

//LevelNode Test
describe("LevelNode", () => {
  it("keeps its type and difficulty", () => {
    const node = new LevelNode("combat", 2);
    expect(node.type).toBe("combat");
    expect(node.difficulty).toBe(2);
  });

  it("starts not cleared", () => {
    expect(new LevelNode("rest", 1).cleared).toBe(false);
  });

  it("can be marked cleared", () => {
    const node = new LevelNode("combat", 1);
    node.cleared = true;
    expect(node.cleared).toBe(true);
  });

  it("rejects a difficulty that isn't a whole number of 1 or more", () => {
    expect(() => new LevelNode("combat", 0)).toThrow();
    expect(() => new LevelNode("combat", 1.5)).toThrow();
    expect(() => new LevelNode("combat", NaN)).toThrow();
  });
});




//Level Test
describe("Level", () => {
  it("has 3 fights followed by one rest stop", () => {
    const types = new Level(1).nodes.map((node) => node.type);
    expect(FIGHTS_PER_LEVEL).toBe(3);
    expect(types).toEqual(["combat", "combat", "combat", "rest"]);
  });

  it("uses the level number as every stop's difficulty", () => {
    const level = new Level(3);
    expect(level.nodes.every((node) => node.difficulty === 3)).toBe(true);
  });

  it("starts at the first stop", () => {
    const level = new Level(1);
    expect(level.currentIndex).toBe(0);
    expect(level.currentNode()).toBe(level.nodes[0]);
  });

  it("clears stops in order, one at a time", () => {
    const level = new Level(1);
    level.completeCurrent();
    expect(level.nodes[0].cleared).toBe(true);
    expect(level.nodes[1].cleared).toBe(false);
    expect(level.currentIndex).toBe(1);
  });

  it("is complete after the rest stop and can't go further", () => {
    const level = new Level(1);
    for (let i = 0; i < 4; i++) level.completeCurrent();   // 3 fights + rest
    expect(level.isComplete()).toBe(true);
    expect(level.currentNode()).toBeUndefined();
    expect(() => level.completeCurrent()).toThrow();
  });

  it("rejects bad level numbers", () => {
    expect(() => new Level(0)).toThrow();
    expect(() => new Level(1.5)).toThrow();
    expect(() => new Level(NaN)).toThrow();
  });
});



// wins every fight in the current level so the rest stop is next
function winAllFights(state: GameState): void {
  for (let i = 0; i < FIGHTS_PER_LEVEL; i++) finishCombat(state, "win");
}

//GameState Test
describe("GameState", () => {
  it("starts at level 1, first stop, full HP, not over", () => {
    const json = new GameState().toJSON();
    expect(json.level).toBe(1);
    expect(json.currentIndex).toBe(0);
    expect(json.player.hp).toBe(json.player.maxHp);
    expect(json.gameOver).toBe(false);
    expect(json.nodes).toEqual([
      { type: "combat", cleared: false },
      { type: "combat", cleared: false },
      { type: "combat", cleared: false },
      { type: "rest", cleared: false },
    ]);
  });

  it("includes the player's attack and defense", () => {
    const json = new GameState().toJSON();
    expect(json.player.attack).toBe(10);
    expect(json.player.defense).toBe(0.1);
  });
});

//GameManager Test
describe("GameManager", () => {
  it("moves to the next stop after a combat win", () => {
    const state = new GameState();
    finishCombat(state, "win");
    expect(state.level.currentIndex).toBe(1);
    expect(state.level.nodes[0].cleared).toBe(true);
    expect(state.gameOver).toBe(false);
  });

  it("ends the game after a combat loss", () => {
    const state = new GameState();
    finishCombat(state, "lose");
    expect(state.gameOver).toBe(true);
    expect(state.level.currentIndex).toBe(0);
  });

  it("refuses any action once the game is over", () => {
    const state = new GameState();
    finishCombat(state, "lose");
    expect(() => finishCombat(state, "win")).toThrow(GameFlowError);
    expect(() => finishRest(state)).toThrow(GameFlowError);
  });

  it("won't let the player rest before all fights are won", () => {
    const state = new GameState();
    finishCombat(state, "win");
    expect(() => finishRest(state)).toThrow(GameFlowError);
  });

  it("won't treat the rest stop as a fight", () => {
    const state = new GameState();
    winAllFights(state);
    expect(() => finishCombat(state, "win")).toThrow(GameFlowError);
  });

  it("starts a harder level after resting", () => {
    const state = new GameState();
    winAllFights(state);
    finishRest(state);
    expect(state.level.number).toBe(2);
    expect(state.level.currentIndex).toBe(0);
    expect(state.level.nodes.every((node) => node.difficulty === 2)).toBe(true);
  });

  it("requireCurrentStop returns the current stop when it matches", () => {
    const state = new GameState();
    const node = requireCurrentStop(state, "combat");
    expect(node).toBe(state.level.nodes[0]);
    expect(node.difficulty).toBe(1);
  });
});
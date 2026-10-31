// Tests 3 combats per level, rest at the end, no skipping stops, next level after rest, game over on loss. (Sally)
import { describe, expect, it } from "vitest";
import { FIGHTS_PER_LEVEL, Level } from "../backend/game/Level";
import { LevelNode } from "../backend/game/LevelNode";

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
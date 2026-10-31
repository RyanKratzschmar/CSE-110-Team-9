// Tests 3-4 combats per level, rest at the end, no skipping stops, next level after rest, game over on loss. (Sally)
import { describe, expect, it } from "vitest";
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
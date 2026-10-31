// LevelNode: one stop on the level map: type (combat or rest), difficulty, and whether it is cleared. (Sally)

export type NodeType = "combat" | "rest";

export class LevelNode {
  cleared = false;

  constructor(readonly type: NodeType, readonly difficulty: number) {
    if (!Number.isInteger(difficulty) || difficulty < 1) {
      throw new Error("Difficulty must be a whole number starting at 1");
    }
  }
}
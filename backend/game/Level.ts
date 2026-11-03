// Level: one level of the map: 3 combat stops then one rest stop, with difficulty from the level number. (Sally)
import { LevelNode } from "./LevelNode";

export const FIGHTS_PER_LEVEL = 3;

export class Level {
  readonly nodes: readonly LevelNode[];
  private index = 0;

  //the level number is also passed into LevelNode constructor as a difficulty indicator. As level number increases, the problems gets more difficult..
  constructor(readonly number: number) {
    if (!Number.isInteger(number) || number < 1) {
      throw new Error("Level number must be a whole number starting at 1");
    }

    //3 combats and 1 rest per level for now
    const combats = Array.from({ length: FIGHTS_PER_LEVEL }, () => new LevelNode("combat", number));
    this.nodes = [...combats, new LevelNode("rest", number)];
  }

  //gets the position [1,2,3 or 4]
  get currentIndex(): number {
    return this.index;
  }

  // gets the actual node
  currentNode(): LevelNode | undefined {
    return this.nodes[this.index];
  }

  completeCurrent(): void {
    const node = this.currentNode();
    if (!node) throw new Error("This level is already complete");
    node.cleared = true;
    this.index++;
  }

  isComplete(): boolean {
    return this.index >= this.nodes.length;
  }
}
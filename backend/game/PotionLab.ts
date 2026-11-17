// PotionLab: one brewing attempt: pick a difficulty, get a PEMDAS equation, check the answer; a right answer brews exactly one potion. (Sally)

import type { RandomEquation } from "../equations/RandomEquation";
import { getEquation } from "../equations/EquationFactory";
import type { Item } from "./Player";
import type { PotionType, RecipeLevel } from "./Potion";

// Difficulty passed to Oliver's factory: up to 25 gives 2 parts (e.g. 4*4+6*12), 26 to 50 gives 3 parts
export const RECIPE_DIFFICULTY: Record<RecipeLevel, number> = { basic: 0, advanced: 26 };

// Default equation source: a PEMDAS equation from Oliver's EquationFactory
export function makePotionEquation(level: RecipeLevel): RandomEquation {
  return getEquation({ type: "Potion" }, RECIPE_DIFFICULTY[level]);
}

export class PotionLab {
  private potionType: PotionType | null = null;
  private level: RecipeLevel | null = null;
  private equation: RandomEquation | null = null;
  private closed = false; // one attempt per floor

  constructor(
    private readonly inventory: Item[], // pass in player.inventory
    private readonly makeEquation: (level: RecipeLevel) => RandomEquation = makePotionEquation, // tests can pass a fixed one
  ) {}

  isClosed(): boolean {
    return this.closed;
  }

  // Screen 1: pick Healing, Strength, or Poison
  chooseType(type: PotionType): void {
    if (this.closed) throw new Error("The lab is closed until the next floor");
    if (this.equation !== null) throw new Error("A recipe is already in progress");
    this.potionType = type;
  }

  // Screen 2: pick Basic or Advanced; returns the equation text to show
  chooseRecipe(level: RecipeLevel): string {
    if (this.potionType === null) throw new Error("Choose a potion type first");
    if (this.equation !== null) throw new Error("A recipe is already in progress");
    this.level = level;
    this.equation = this.makeEquation(level);
    return this.equation.getPrint();
  }

  // The equation in progress. On a wrong answer, pass in the wrong answer explanation popup
  getEquation(): RandomEquation | null {
    return this.equation;
  }

  // Screen 3: true = right, potion goes into the inventory. Lab closes.
  submit(answer: number): boolean {
    if (this.closed) throw new Error("The lab is closed until the next floor");
    if (!this.equation || !this.potionType || !this.level) throw new Error("Choose a recipe first");
    // if answr is invalid, give another chance
    if (!Number.isFinite(answer)) throw new Error("Answer must be a number");

    this.closed = true;
    if (!this.equation.checkAnswer(answer)) return false;

    this.inventory.push({ type: this.potionType, level: this.level });
    return true;
  }

  // Leave button, closes the lab
  leave(): void {
    if (this.equation !== null) this.closed = true;
  }
}
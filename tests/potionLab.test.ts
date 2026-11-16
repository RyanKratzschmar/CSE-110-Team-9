// Tests the potion lab: the equation is displayed and correct/incorrect answers are validated. (Sally)
import { describe, expect, it } from "vitest";
import { PotionLab } from "../backend/game/PotionLab";
import { Player } from "../backend/game/Player";
import type { RecipeLevel } from "../backend/game/Potion";
import { HEAL_PERCENT } from "../backend/game/Potion";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";

// Always gives the mockup's equation (answer 14) and remembers which level was asked for.
// MultiplicationEquation is only used because it can hold any fixed equation and answer.
function fixedEquations() {
  const askedFor: RecipeLevel[] = [];
  const make = (level: RecipeLevel) => {
    askedFor.push(level);
    return new MultiplicationEquation(true, "2 * 6 + 18 / 3 - 4 = ", 14, [2, "*", 6, "+", 18, "/", 3, "-", 4]);
  };
  return { askedFor, make };
}

describe("PotionLab", () => {
  it("shows the equation for the chosen recipe", () => {
    const eq = fixedEquations();
    const lab = new PotionLab(new Player().inventory, eq.make);
    lab.chooseType("poison");
    expect(lab.chooseRecipe("advanced")).toBe("2 * 6 + 18 / 3 - 4 = ");
    expect(eq.askedFor).toEqual(["advanced"]);
  });

  it("a right answer adds exactly one potion to the player's inventory", () => {
    const player = new Player();
    const lab = new PotionLab(player.inventory, fixedEquations().make);
    lab.chooseType("strength");
    lab.chooseRecipe("basic");
    expect(lab.submit(14)).toBe(true);
    expect(player.inventory).toEqual([{ type: "strength", level: "basic" }]);
    expect(() => lab.submit(14)).toThrow(); // no second potion
    expect(player.inventory).toHaveLength(1);
  });

  it("a wrong answer adds nothing, closes the lab, and keeps the equation for the popup", () => {
    const player = new Player();
    const lab = new PotionLab(player.inventory, fixedEquations().make);
    lab.chooseType("healing");
    lab.chooseRecipe("basic");
    expect(lab.submit(13)).toBe(false);
    expect(player.inventory).toHaveLength(0);
    expect(lab.isClosed()).toBe(true);
    expect(lab.getEquation()?.getAnswer()).toBe(14);
  });

  it("rejects a non-number answer without using up the attempt", () => {
    const lab = new PotionLab(new Player().inventory, fixedEquations().make);
    lab.chooseType("healing");
    lab.chooseRecipe("basic");
    expect(() => lab.submit(NaN)).toThrow();
    expect(lab.isClosed()).toBe(false);
    expect(lab.submit(14)).toBe(true);
  });

  it("steps must happen in order", () => {
    const lab = new PotionLab(new Player().inventory, fixedEquations().make);
    expect(() => lab.chooseRecipe("basic")).toThrow(); // no type yet
    expect(() => lab.submit(14)).toThrow(); // no recipe yet
  });

  it("leaving before the equation is shown is free; leaving after closes the lab", () => {
    const early = new PotionLab(new Player().inventory, fixedEquations().make);
    early.chooseType("poison");
    early.leave();
    expect(early.isClosed()).toBe(false);

    const late = new PotionLab(new Player().inventory, fixedEquations().make);
    late.chooseType("poison");
    late.chooseRecipe("basic");
    late.leave();
    expect(late.isClosed()).toBe(true);
  });
});

describe("Potion effects", () => {
  it("an advanced healing potion heals more than a basic one", () => {
    expect(HEAL_PERCENT.advanced).toBeGreaterThan(HEAL_PERCENT.basic);
  });
});
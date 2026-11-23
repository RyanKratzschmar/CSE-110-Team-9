// Tests the potion lab: the equation is displayed and correct/incorrect answers are validated. (Sally)
import { describe, expect, it } from "vitest";
import { PotionLab } from "../backend/game/PotionLab";
import { Player } from "../backend/game/Player";
import type { Potion, RecipeLevel } from "../backend/game/Potion";
import { HEAL_PERCENT, describePotion, groupPotions, potionName } from "../backend/game/Potion";
import { MultiOperationEquation } from "../backend/equations/MultiOperationEquation";
import { GameState } from "../backend/game/GameState";
import { Level } from "../backend/game/Level";

// Always gives the mockup's equation (answer 14) and remembers which level was asked for.
// Fixed mode: (difficulty, equation, answer); the printed text is built from the equation.
function fixedEquations() {
  const askedFor: RecipeLevel[] = [];
  const make = (level: RecipeLevel) => {
    askedFor.push(level);
    return new MultiOperationEquation(1, [2, "*", 6, "+", 18, "\u00F7", 3, "-", 4], 14);
  };
  return { askedFor, make };
}

describe("PotionLab", () => {
  it("shows the equation for the chosen recipe", () => {
    const eq = fixedEquations();
    const lab = new PotionLab(new Player().inventory, eq.make);
    lab.chooseType("poison");
    expect(lab.chooseRecipe("advanced")).toBe("2 * 6 + 18 \u00F7 3 - 4 = ?");
    expect(eq.askedFor).toEqual(["advanced"]);
  });

  it("uses Oliver's PEMDAS equations by default; advanced has more parts than basic", () => {
    const basic = new PotionLab(new Player().inventory);
    basic.chooseType("healing");
    basic.chooseRecipe("basic");
    expect(basic.getEquation()?.getType()).toBe("Pemdas");
    expect(basic.getEquation()?.getEquation()).toHaveLength(7); // e.g. 4*4+6*12

    const advanced = new PotionLab(new Player().inventory);
    advanced.chooseType("healing");
    advanced.chooseRecipe("advanced");
    expect(advanced.getEquation()?.getEquation().length).toBeGreaterThanOrEqual(11); // e.g. 4*4+6*12-9/3
    expect(advanced.getEquation()?.getEquation().length).toBeLessThanOrEqual(17); // e.g. 4*4*4+6*12*4-9*3*4
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

describe("GameState potion lab", () => {
  it("gives the same lab all level and a fresh one on the next level", () => {
    const state = new GameState();
    const lab = state.potionLabForLevel();
    expect(state.potionLabForLevel()).toBe(lab);
    state.level = new Level(2);
    expect(state.potionLabForLevel()).not.toBe(lab);
  });

  it("a used lab stays closed when you come back on the same level", () => {
    const state = new GameState();
    const lab = state.potionLabForLevel();
    lab.chooseType("healing");
    lab.chooseRecipe("basic");
    lab.leave();
    expect(state.potionLabForLevel().isClosed()).toBe(true);
  });

  it("brews into the shared player's inventory", () => {
    const state = new GameState();
    const lab = state.potionLabForLevel();
    lab.chooseType("poison");
    lab.chooseRecipe("basic");
    lab.submit(lab.getEquation()!.getAnswer());
    expect(state.player.inventory).toEqual([{ type: "poison", level: "basic" }]);
  });
});

describe("Inventory across floors", () => {
  it("potions from different floors stack up in brewing order", () => {
    const player = new Player();
    for (const type of ["healing", "poison", "healing"] as const) {
      const lab = new PotionLab(player.inventory, fixedEquations().make); // a fresh lab each floor
      lab.chooseType(type);
      lab.chooseRecipe("basic");
      expect(lab.submit(14)).toBe(true);
    }
    expect(player.inventory.map((p) => p.type)).toEqual(["healing", "poison", "healing"]);
  });
});

describe("Potion names and descriptions", () => {
  it("names a potion by its level and type", () => {
    expect(potionName({ type: "healing", level: "basic" })).toBe("Basic Healing Potion");
    expect(potionName({ type: "strength", level: "advanced" })).toBe("Advanced Strength Potion");
    expect(potionName({ type: "poison", level: "basic" })).toBe("Basic Poison Potion");
  });

  it("describes what each potion does", () => {
    expect(describePotion({ type: "healing", level: "advanced" })).toBe("Heals 30% max HP");
    expect(describePotion({ type: "healing", level: "basic" }, 10)).toBe("Heals 30% max HP"); // with an upgrade bonus
    expect(describePotion({ type: "strength", level: "basic" })).toBe("Doubles your attack damage for 1 round");
    expect(describePotion({ type: "poison", level: "advanced" })).toBe(
      "Poisons the enemy for 10% of its max HP each round for 2 rounds",
    );
  });
});

describe("groupPotions", () => {
  it("returns nothing for an empty inventory", () => {
    expect(groupPotions([])).toEqual([]);
  });

  it("groups by type and level, counts them, and points at the first one", () => {
    const potions: Potion[] = [
      { type: "poison", level: "basic" },
      { type: "healing", level: "basic" },
      { type: "poison", level: "basic" },
      { type: "poison", level: "advanced" },
      { type: "healing", level: "basic" },
    ];
    expect(groupPotions(potions)).toEqual([
      { potion: { type: "poison", level: "basic" }, count: 2, firstIndex: 0 },
      { potion: { type: "healing", level: "basic" }, count: 2, firstIndex: 1 },
      { potion: { type: "poison", level: "advanced" }, count: 1, firstIndex: 3 },
    ]);
  });

  it("never has more than 6 groups (3 types x 2 levels)", () => {
    const potions: Potion[] = [];
    for (const type of ["healing", "strength", "poison"] as const) {
      for (const level of ["basic", "advanced"] as const) {
        potions.push({ type, level }, { type, level });
      }
    }
    expect(groupPotions(potions)).toHaveLength(6);
  });
});

import type { GameState } from "./GameState";
import { finishRest, GameFlowError, requireCurrentStop } from "./GameManager";
import { RestStop } from "./RestStop";

export type RestOption = "upgrade" | "potions" | "leave";

export class InvalidRestOptionError extends Error {}

export class RestMenu {
  constructor(private restStop: RestStop) {}

  // The player must enter Rest before using its menu.
  private checkRest(state: GameState): void {
    requireCurrentStop(state, "rest");
    if (!this.restStop.hasEntered(state)) {
      throw new GameFlowError("Enter rest before using the menu");
    }
  }

  // Give the frontend the three buttons it should display.
  getOptions(state: GameState) {
    this.checkRest(state);
    return [
      { id: "upgrade", label: "Upgrade Mini Game" },
      { id: "potions", label: "Potions Mini Game" },
      { id: "leave", label: "Leave Rest" },
    ];
  }

  // For now, return the screen name; David's game will connect later.
  selectUpgrade(state: GameState): "upgrade" {
    this.checkRest(state);
    return "upgrade";
  }

  // For now, return the screen name; the potion game will connect later.
  selectPotion(state: GameState): "potions" {
    this.checkRest(state);
    return "potions";
  }

  // Use our existing game flow to continue to the next level.
  leaveRest(state: GameState): void {
    this.checkRest(state);
    finishRest(state);
    this.restStop.leave(state);
  }

  // Handle one of the three menu choices.
  selectOption(state: GameState, option: unknown): "upgrade" | "potions" | "game" {
    if (option === "upgrade") return this.selectUpgrade(state);
    if (option === "potions") return this.selectPotion(state);
    if (option === "leave") {
      this.leaveRest(state);
      return "game";
    }
    throw new InvalidRestOptionError("Invalid Rest menu option");
  }
}

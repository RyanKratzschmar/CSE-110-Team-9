import type { GameState } from "./GameState";
import { finishRest, GameFlowError, requireCurrentStop } from "./GameManager";
import type { RestStop } from "./RestStop";

export type RestOption = "upgrade" | "potion" | "leave";

export class InvalidRestOptionError extends Error {}

export class RestMenu {
  // Use the same RestStop as the Rest screen.
  constructor(private readonly restStop: RestStop) {}

  // The player must enter Rest before using its menu.
  private checkRest(state: GameState): void {
    requireCurrentStop(state, "rest");
    if (!this.restStop.hasEntered(state)) {
      throw new GameFlowError("Enter rest before using the menu");
    }
  }

  // Return the three choices in the Rest menu.
  getOptions(state: GameState) {
    this.checkRest(state);
    return [
      { id: "upgrade", label: "Upgrade Mini Game" },
      { id: "potion", label: "Potion Mini Game" },
      { id: "leave", label: "Leave Rest" },
    ];
  }

  // Return the Upgrade screen name.
  selectUpgrade(state: GameState): "upgrade" {
    this.checkRest(state);
    return "upgrade";
  }

  // // Return the potion screen name.
  selectPotion(state: GameState): "potion" {
    this.checkRest(state);
    return "potion";
  }

  // Finish Rest once and clear the entry flag.
  leaveRest(state: GameState): void {
    this.checkRest(state);
    finishRest(state);
    this.restStop.leave(state);
  }

  // Handle one of the three menu choices.
  selectOption(state: GameState, option: unknown): "upgrade" | "potion" | "map" {
    if (option === "upgrade") return this.selectUpgrade(state);
    if (option === "potion") return this.selectPotion(state);
    if (option === "leave") {
      this.leaveRest(state);
      return "map";
    }
    throw new InvalidRestOptionError("Invalid Rest menu option");
  }
}

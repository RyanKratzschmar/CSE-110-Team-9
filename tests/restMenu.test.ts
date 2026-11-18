import { describe, expect, it } from "vitest";
import { RestMenu, InvalidRestOptionError } from "../backend/game/RestMenu";
import { RestStop } from "../backend/game/RestStop";
import { GameState } from "../backend/game/GameState";
import { GameFlowError } from "../backend/game/GameManager";

// Create a real game at its Rest node.
function makeRestGame(enterRest = true) {
  const state = new GameState();

  // Complete the three combat nodes before Rest.
  state.level.completeCurrent();
  state.level.completeCurrent();
  state.level.completeCurrent();

  // The menu and the Rest screen use the same RestStop.
  const restStop = new RestStop();
  const menu = new RestMenu(restStop);
  if (enterRest) restStop.rest(state);

  return { state, restStop, menu };
}

describe("Rest Menu", () => {
  it("shows all three menu options", () => {
    const { state, menu } = makeRestGame();
    expect(menu.getOptions(state)).toEqual([
      { id: "upgrade", label: "Upgrade Mini Game" },
      { id: "potion", label: "Potion Mini Game" },
      { id: "leave", label: "Leave Rest" },
    ]);
  });

  it("selects the Upgrade Mini Game", () => {
    const { state, menu } = makeRestGame();
    expect(menu.selectOption(state, "upgrade")).toBe("upgrade");
    expect(state.level.number).toBe(1);
    expect(state.level.currentNode()?.type).toBe("rest");
  });

  it("selects the Potion Lab", () => {
    const { state, menu } = makeRestGame();
    expect(menu.selectOption(state, "potion")).toBe("potion");
    expect(state.level.number).toBe(1);
    expect(state.level.currentNode()?.type).toBe("rest");
  });

  it("leaves Rest and returns to the next level map", () => {
    const { state, restStop, menu } = makeRestGame();
    expect(menu.selectOption(state, "leave")).toBe("map");
    expect(state.level.number).toBe(2);
    expect(state.level.currentIndex).toBe(0);
    expect(restStop.hasEntered(state)).toBe(false);
  });

  it("rejects invalid menu options", () => {
    const { state, menu } = makeRestGame();
    expect(() => menu.selectOption(state, "invalid")).toThrow(InvalidRestOptionError);
  });

  it("rejects menu use before entering Rest", () => {
    const { state, menu } = makeRestGame(false);
    expect(() => menu.getOptions(state)).toThrow(GameFlowError);
    expect(() => menu.selectOption(state, "upgrade")).toThrow(GameFlowError);
    expect(() => menu.selectOption(state, "potion")).toThrow(GameFlowError);
    expect(() => menu.selectOption(state, "leave")).toThrow(GameFlowError);
    expect(state.level.number).toBe(1);
  });

  it("rejects menu use at a combat node", () => {
    const state = new GameState();
    const menu = new RestMenu(new RestStop());
    expect(() => menu.getOptions(state)).toThrow(GameFlowError);
    expect(() => menu.selectOption(state, "upgrade")).toThrow(GameFlowError);
    expect(() => menu.selectOption(state, "potion")).toThrow(GameFlowError);
    expect(() => menu.selectOption(state, "leave")).toThrow(GameFlowError);
  });

  it("does not allow Leave Rest twice", () => {
    const { state, menu } = makeRestGame();
    expect(menu.selectOption(state, "leave")).toBe("map");
    expect(() => menu.selectOption(state, "leave")).toThrow(GameFlowError);
    expect(state.level.number).toBe(2);
    expect(state.level.currentIndex).toBe(0);
  });
});

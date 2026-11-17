import { describe, expect, it } from "vitest";
import { RestMenu, InvalidRestOptionError } from "../backend/game/RestMenu";
import { RestStop } from "../backend/game/RestStop";
import { GameState } from "../backend/game/GameState";
import { GameFlowError } from "../backend/game/GameManager";

// Make a real game and move it to the Rest node.
function makeRestGame() {
  const state = new GameState();

  // Complete the three combat nodes before Rest.
  state.level.completeCurrent();
  state.level.completeCurrent();
  state.level.completeCurrent();

  const restStop = new RestStop();
  restStop.rest(state);
  return { state, menu: new RestMenu(restStop) };
}

describe("Rest Menu", () => {
  it("shows all three menu options", () => {
    const { state, menu } = makeRestGame();
    expect(menu.getOptions(state).map((item) => item.id)).toEqual([
      "upgrade", "potions", "leave",
    ]);
  });

  it("selects the Upgrade Mini Game", () => {
    const { state, menu } = makeRestGame();
    expect(menu.selectOption(state, "upgrade")).toBe("upgrade");
  });

  it("selects the Potions Mini Game", () => {
    const { state, menu } = makeRestGame();
    expect(menu.selectOption(state, "potions")).toBe("potions");
  });

  it("leaves Rest and starts the next level", () => {
    const { state, menu } = makeRestGame();
    expect(menu.selectOption(state, "leave")).toBe("map");
    expect(state.level.number).toBe(2);
    expect(state.level.currentIndex).toBe(0);
  });

  it("rejects invalid menu options", () => {
    const { state, menu } = makeRestGame();
    expect(() => menu.selectOption(state, "invalid")).toThrow(InvalidRestOptionError);
  });

  it("rejects menu use before entering Rest", () => {
    const state = new GameState();
    state.level.completeCurrent();
    state.level.completeCurrent();
    state.level.completeCurrent();

    // At Rest, but the player has not entered it yet.
    const menu = new RestMenu(new RestStop());
    expect(() => menu.getOptions(state)).toThrow(GameFlowError);
  });

  it("rejects menu use at a combat node", () => {
    const state = new GameState();
    const menu = new RestMenu(new RestStop());
    expect(() => menu.getOptions(state)).toThrow(GameFlowError);
  });

  it("does not allow Leave Rest twice", () => {
    const { state, menu } = makeRestGame();
    expect(menu.selectOption(state, "leave")).toBe("map");
    expect(() => menu.selectOption(state, "leave")).toThrow(GameFlowError);
    expect(state.level.number).toBe(2);
  });
});

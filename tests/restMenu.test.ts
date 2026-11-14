import { describe, expect, it, vi } from "vitest";
import { RestMenu, InvalidRestOptionError } from "../backend/game/RestMenu";
import { RestStop } from "../backend/game/RestStop";
import { Level } from "../backend/game/Level";
import type { GameState } from "../backend/game/GameState";

// Make a simple game already at its Rest node.
function makeRestGame() {
  const state = {
    level: new Level(1),
    gameOver: false,
    player: { healFull: vi.fn() },
  } as unknown as GameState;

  // Finish the three combat nodes before Rest.
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
    expect(menu.selectOption(state, "leave")).toBe("game");
    expect(state.level.number).toBe(2);
    expect(state.level.currentIndex).toBe(0);
  });

  it("rejects invalid menu options", () => {
    const { state, menu } = makeRestGame();
    expect(() => menu.selectOption(state, "invalid")).toThrow(InvalidRestOptionError);
  });
});

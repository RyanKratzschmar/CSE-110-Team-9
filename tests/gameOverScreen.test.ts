// @vitest-environment jsdom
import "vitest-canvas-mock";
import { describe, expect, it, vi } from "vitest";
import { GameSession } from "../src/GameSession";
import { Combat } from "../backend/game/Combat";
import { Monster } from "../backend/game/Monster";
import { finishCombat, finishRest, requireCurrentStop } from "../backend/game/GameManager";
import { GameOverScreenController } from "../src/screens/GameOverScreen/GameOverScreenController";
import { GameOverScreenView } from "../src/screens/GameOverScreen/GameOverScreenView";

function fixture() {
    const session = new GameSession();
    const switchToScreen = vi.fn();
    const controller = new GameOverScreenController({ switchToScreen }, session);
    return { session, switchToScreen, controller };
}

describe("Game Over screen", () => {
    it("starts hidden and shows the heading and both actions when opened", () => {
        const { controller } = fixture();
        const group = controller.getView().getGroup();
        expect(group.visible()).toBe(false);

        controller.show();
        expect(group.visible()).toBe(true);
        expect(group.find("Text").map(node => node.getAttr("text")))
            .toEqual(expect.arrayContaining(["Game Over", "Play Again", "Main Menu"]));

        controller.hide();
        expect(group.visible()).toBe(false);
    });

    it("ends a living player's run when entered from the future quit button", () => {
        const { session, controller } = fixture();
        session.state.combat = new Combat(session.state.player, new Monster(50, 15), 1);
        controller.show();

        expect(session.state.player.hp).toBe(100);
        expect(session.state.gameOver).toBe(true);
        expect(session.state.combat).toBeNull();
        expect(() => requireCurrentStop(session.state, "combat")).toThrow("The game is over");
    });

    it("Play Again replaces the ended run and opens a fresh floor 1 map", () => {
        const { session, controller, switchToScreen } = fixture();
        for (let i = 0; i < 3; i++) finishCombat(session.state, "win");
        finishRest(session.state);
        session.state.player.takeDamage(30);
        session.state.player.applyUpgrade();
        session.state.player.inventory.push({ type: "healing", level: "advanced" });
        session.state.upgradeClaimedLevel = 2;
        const previous = session.state;
        controller.show();

        controller.getView().getGroup().findOne(".play-again")!.fire("click");

        expect(session.state).not.toBe(previous);
        expect(session.state.gameOver).toBe(false);
        expect(session.state.player.hp).toBe(100);
        expect(session.state.player.attack).toBe(10);
        expect(session.state.player.potionHealingBonus).toBe(0);
        expect(session.state.player.inventory).toEqual([]);
        expect(session.state.level.number).toBe(1);
        expect(session.state.level.currentIndex).toBe(0);
        expect(session.state.upgradeClaimedLevel).toBeNull();
        expect(switchToScreen).toHaveBeenCalledTimes(1);
        expect(switchToScreen).toHaveBeenCalledWith({ type: "map" });
    });

    it("Main Menu preserves the ended run and opens the title screen", () => {
        const { session, controller, switchToScreen } = fixture();
        const previous = session.state;
        controller.show();

        controller.getView().getGroup().findOne(".main-menu")!.fire("tap");

        expect(session.state).toBe(previous);
        expect(session.state.gameOver).toBe(true);
        expect(switchToScreen).toHaveBeenCalledTimes(1);
        expect(switchToScreen).toHaveBeenCalledWith({ type: "menu" });
    });

    it("the view delegates each button to the matching callback", () => {
        const restart = vi.fn();
        const menu = vi.fn();
        const view = new GameOverScreenView(restart, menu);
        view.show();
        view.getGroup().findOne(".play-again")!.fire("tap");
        view.getGroup().findOne(".main-menu")!.fire("click");
        expect(restart).toHaveBeenCalledOnce();
        expect(menu).toHaveBeenCalledOnce();
    });
});

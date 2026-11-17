// @vitest-environment jsdom
import "vitest-canvas-mock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameSession } from "../src/GameSession";
import { Combat } from "../backend/game/Combat";
import { Monster } from "../backend/game/Monster";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";
import { CombatMainScreenController } from "../src/screens/CombatMainScreen/CombatMainScreenController";
import { CombatMainScreenView } from "../src/screens/CombatMainScreen/CombatMainScreenView";

function key(value: string, repeat = false) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: value, repeat, cancelable: true }));
}
beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

describe("Combat keyboard input", () => {
    it("accepts digits and Backspace and submits on Enter only while solving", () => {
        const submit = vi.fn();
        const view = new CombatMainScreenView(vi.fn(), vi.fn(), vi.fn(), submit, vi.fn(), vi.fn());
        view.show();
        key("1"); key("Enter");
        expect(submit).not.toHaveBeenCalled();
        view.solveEquation();
        key("1"); key("2"); key("Backspace"); key("3"); key("Enter", true);
        expect(submit).not.toHaveBeenCalled();
        key("Enter");
        expect(submit).toHaveBeenCalledWith(13);
        view.hide();
        key("Enter");
        expect(submit).toHaveBeenCalledTimes(1);
    });
});

describe("Shared local combat", () => {
    const controllers: CombatMainScreenController[] = [];
    afterEach(() => { for (const c of controllers.splice(0)) c.hide(); });
    function fixture(hp = 50, attack = 15) {
        const session = new GameSession();
        session.state.combat = new Combat(session.state.player, new Monster(hp, attack), 1, () =>
            new MultiplicationEquation(0, [2, "*", 3], 6));
        const popup = { isOpen: () => false, close: vi.fn(), showLongMultiplicationHint: vi.fn(), showLongDivisionHint: vi.fn() };
        const switchToScreen = vi.fn();
        const c = new CombatMainScreenController({ switchToScreen }, popup as never, popup as never, session);
        controllers.push(c);
        c.startGame();
        return { c, session, switchToScreen };
    }
    it("uses the entered answer to damage the enemy and preserves the same shared player", () => {
        const { c, session } = fixture();
        c.handleAttackClick();
        key("6"); key("Enter");
        expect(session.state.combat!.getEnemyHp()).toBe(40);
        expect(session.state.player.hp).toBe(100);
        expect(c.getModel().getEnemyHealth()).toBe(40);
        expect(session.state.combat!.currentQuestion().questionId).toBe(1);
        key("Enter");
        expect(session.state.combat!.currentQuestion().questionId).toBe(2);
        expect(session.state.combat!.getEnemyHp()).toBe(40);
    });
    it("keeps feedback visible until Continue and prevents editing the resolved answer", () => {
        const { c, session } = fixture();
        c.handleAttackClick(); key("6"); key("Enter");
        const text = () => c.getView().getGroup().find("Text").map(node => node.getAttr("text"));
        expect(text()).toContain("Correct!");
        expect(text()).toContain("CONTINUE");
        key("9");
        expect(text()).not.toContain("9");
        expect(session.state.combat!.getEnemyHp()).toBe(40);
        expect(window.alert).not.toHaveBeenCalled();
        key("Enter");
        expect(text()).not.toContain("Correct!");
        expect(text()).toContain("SUBMIT");
        expect(session.state.combat!.currentQuestion().questionId).toBe(2);
    });

    it("damages the shared player on incorrect answers", () => {
        const { c, session } = fixture();
        c.handleAttackClick(); key("7"); key("Enter");
        expect(session.state.player.hp).toBe(86);
        expect(c.getModel().getPlayerHealth()).toBe(86);
        expect(c.getView().getGroup().find("Text").some(node => node.getAttr("text") === "Incorrect. The correct answer is 6.")).toBe(true);
        expect(window.alert).not.toHaveBeenCalled();
    });
    it("rejects an empty answer without consuming the question", () => {
        const { c, session } = fixture();
        c.handleAttackClick(); key("Enter");
        expect(session.state.combat!.currentQuestion().questionId).toBe(1);
        expect(session.state.player.hp).toBe(100);
        expect(window.alert).not.toHaveBeenCalled();
        expect(c.getView().getGroup().find("Text").some(node => node.getAttr("text") === "Enter a valid whole-number answer.")).toBe(true);
    });
    it("advances once on win and clears the completed fight", () => {
        const { c, session, switchToScreen } = fixture(10);
        c.handleAttackClick(); key("6"); key("Enter");
        expect(session.state.level.currentIndex).toBe(1);
        expect(session.state.combat).toBeNull();
        expect(switchToScreen).not.toHaveBeenCalled();
        key("Enter");
        expect(switchToScreen).toHaveBeenCalledWith({ type: "map" });
        expect(session.state.level.currentIndex).toBe(1);
    });
    it("marks the shared run game over on loss", () => {
        const { c, session, switchToScreen } = fixture(50, 200);
        c.handleAttackClick(); key("7"); key("Enter");
        expect(session.state.gameOver).toBe(true);
        expect(session.state.player.hp).toBe(0);
        expect(switchToScreen).not.toHaveBeenCalled();
        key("Enter");
        expect(switchToScreen).toHaveBeenCalledWith({ type: "menu" });
    });
    it("reopening a fight preserves HP and its question", () => {
        const { c, session } = fixture();
        session.state.player.takeDamage(20);
        const game = session.state.combat;
        c.hide(); c.startGame();
        expect(session.state.combat).toBe(game);
        expect(c.getModel().getPlayerHealth()).toBe(82);
    });
});

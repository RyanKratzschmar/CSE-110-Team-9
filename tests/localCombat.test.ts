// @vitest-environment jsdom
import "vitest-canvas-mock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameSession } from "../src/GameSession";
import { Combat } from "../backend/game/Combat";
import { Monster } from "../backend/game/Monster";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";
import { DivisionEquation } from "../backend/equations/DivisionEquation";
import { CombatMainScreenController } from "../src/screens/CombatMainScreen/CombatMainScreenController";
import { CombatMainScreenView } from "../src/screens/CombatMainScreen/CombatMainScreenView";

// Simulates pressing a key by sending a keydown event to the window
function key(value: string, repeat = false) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: value, repeat, cancelable: true }));
}

// Returns true if the button with the given label ("Get Hint" or "Explain") is currently shown
function buttonVisible(c: CombatMainScreenController, label: string): boolean {
    const node = c.getView().getGroup().find("Text").find(n => n.getAttr("text") === label);
    return node !== undefined && node.visible();
}

// Hides every controller after each test so leftover keyboard listeners don't leak into the next test
const controllers: CombatMainScreenController[] = [];
afterEach(() => { for (const c of controllers.splice(0)) c.hide(); });

// Creates a fresh 2 * 3 fight against a test monster and returns its controller, session and screen-switch mock
function fixture(hp = 50, attack = 15) {
    const session = new GameSession();
    session.state.combat = new Combat(session.state.player, new Monster(hp, attack), 1, () => new MultiplicationEquation(0, [2, "*", 3], 6));
    const popup = { isOpen: () => false, close: vi.fn(), showLongMultiplicationHint: vi.fn(), showLongDivisionHint: vi.fn() };
    const switchToScreen = vi.fn();
    const c = new CombatMainScreenController({ switchToScreen }, popup as never, popup as never, session);
    controllers.push(c);
    c.startGame();
    return { c, session, switchToScreen };
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
        expect(switchToScreen).toHaveBeenCalledWith({ type: "gameover" });
    });
    it("opens Game Over when an enemy counterattack after a potion is lethal", () => {
        vi.useFakeTimers();
        try {
            const { c, session, switchToScreen } = fixture(50, 200);
            session.state.player.inventory.push({ type: "healing", level: "basic" });
            c.handlePotionClick();
            c.handleDrinkPotion(0);

            expect(session.state.player.hp).toBe(0);
            expect(session.state.gameOver).toBe(true);
            expect(session.state.combat).toBeNull();
            expect(c.getPotionPopUp().isOpen()).toBe(false);
            expect(switchToScreen).toHaveBeenCalledWith({ type: "gameover" });

            session.newGame();
            vi.advanceTimersByTime(4000);
            expect(session.state.gameOver).toBe(false);
            expect(switchToScreen).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
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

describe("Get Hint / Explain button swap", () => {
    it("shows Get Hint, not Explain, while answering", () => {
        const { c } = fixture();
        c.handleAttackClick();
        expect(buttonVisible(c, "Get Hint")).toBe(true);
        expect(buttonVisible(c, "Explain")).toBe(false);
    });

    it("keeps Get Hint and hides Explain after a correct answer", () => {
        const { c } = fixture();
        c.handleAttackClick(); key("6"); key("Enter");
        expect(buttonVisible(c, "Get Hint")).toBe(true);
        expect(buttonVisible(c, "Explain")).toBe(false);
    });

    it("swaps Get Hint for Explain after a wrong answer, then restores Get Hint on the next question", () => {
        const { c } = fixture();
        c.handleAttackClick(); key("7"); key("Enter");
        expect(buttonVisible(c, "Explain")).toBe(true);
        expect(buttonVisible(c, "Get Hint")).toBe(false);
        key("Enter");
        c.handleAttackClick();
        expect(buttonVisible(c, "Get Hint")).toBe(true);
        expect(buttonVisible(c, "Explain")).toBe(false);
    });

    it("does not show Explain when a wrong answer ends the game", () => {
        const { c } = fixture(50, 200);
        c.handleAttackClick(); key("7"); key("Enter");
        expect(buttonVisible(c, "Explain")).toBe(false);
    });
});


describe("Get Hint / Explain pop-ups", () => {
    // Starts a fight that uses real generated equations, with mocked pop-ups
    function popUpFixture(equation: MultiplicationEquation | DivisionEquation) {
        const session = new GameSession();
        session.state.combat = new Combat(session.state.player, new Monster(50, 15), 1, () => equation);
        const explanation = { isOpen: () => false, close: vi.fn(), showLongMultiplicationExplanation: vi.fn(), showLongDivisionExplanation: vi.fn() };
        const hint = { isOpen: () => false, close: vi.fn(), showLongMultiplicationHint: vi.fn(), showLongDivisionHint: vi.fn() };
        const c = new CombatMainScreenController({ switchToScreen: vi.fn() }, explanation as never, hint as never, session);
        controllers.push(c);
        c.startGame();
        return { c, explanation, hint };
    }

    it("opens the multiplication pop-ups with the numbers from the question", () => {
        const equation = new MultiplicationEquation(1);
        const [a, , b] = equation.getEquation();
        const { c, explanation, hint } = popUpFixture(equation);
        c.handleHintClick();
        c.handleExplanationClick();
        expect(hint.showLongMultiplicationHint).toHaveBeenCalledWith(a, b);
        expect(explanation.showLongMultiplicationExplanation).toHaveBeenCalledWith(a, b);
    });

    it("opens the division pop-ups with the numbers from the question", () => {
        const equation = new DivisionEquation(1);
        const [a, , b] = equation.getEquation();
        const { c, explanation, hint } = popUpFixture(equation);
        c.handleHintClick();
        c.handleExplanationClick();
        expect(hint.showLongDivisionHint).toHaveBeenCalledWith(a, b);
        expect(explanation.showLongDivisionExplanation).toHaveBeenCalledWith(a, b);
    });
});
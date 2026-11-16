// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CombatMainScreenController } from "../src/screens/CombatMainScreen/CombatMainScreenController";
import * as api from "../frontend/src/api";
vi.mock("../frontend/src/api", () => ({ getCombat: vi.fn(), submitAnswer: vi.fn() }));
vi.mock("../src/screens/CombatMainScreen/CombatMainScreenView", () => ({
    CombatMainScreenView: class {
        show = vi.fn(); hide = vi.fn(); resetFight = vi.fn(); returnToCombat = vi.fn();
        updateEnemyHealthBar = vi.fn(); setPlayerHealthBar = vi.fn(); setQuestion = vi.fn();
        endGameText = vi.fn();
    },
}));
const combat = { combatId: "fight", questionId: 1, question: "10 * 20 = ", playerHp: 100, playerMaxHp: 100, enemyHp: 50, enemyMaxHp: 50 };
const result: api.AnswerResponse = { combatId: "fight", questionId: 1, correct: false, correctAnswer: 200, playerHp: 86, enemyHp: 50, result: "ongoing" };
const switchToScreen = vi.fn();
function createController() {
    const popup = { isOpen: () => false, close: vi.fn() };
    return new CombatMainScreenController({ switchToScreen, startNewGame: vi.fn() }, popup as never, popup as never);
}
beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("Audio", class {});
    vi.mocked(api.getCombat).mockResolvedValue(combat);
    vi.mocked(api.submitAnswer).mockResolvedValue(result);
});
afterEach(() => vi.unstubAllGlobals());

describe("Combat answer submission", () => {
    it.each([undefined, NaN, Infinity])("rejects invalid input %s", async answer => {
        const c = createController();
        await c.startGame("run");
        await c.handleSubmitClick(answer);
        expect(api.submitAnswer).not.toHaveBeenCalled();
        expect(alert).toHaveBeenCalledWith("Enter a valid answer first.");
    });
    it("submits the IDs and answer, displays server HP and feedback, and loads the next question", async () => {
        const c = createController();
        await c.startGame("run");
        vi.mocked(api.getCombat).mockResolvedValue({ ...combat, questionId: 2, playerHp: 86 });
        await c.handleSubmitClick(201);
        expect(api.submitAnswer).toHaveBeenCalledWith("run", "fight", 1, 201);
        expect(c.getModel().getPlayerHealth()).toBe(86);
        expect(c.getView().setPlayerHealthBar).toHaveBeenLastCalledWith(86, 100);
        expect(alert).toHaveBeenCalledWith("Incorrect. The correct answer is 200.");
        expect(c.getModel().getQuestionId()).toBe(2);
    });
    it("ignores duplicate clicks while a request is pending", async () => {
        const c = createController();
        await c.startGame("run");
        let resolve!: (value: api.AnswerResponse) => void;
        vi.mocked(api.submitAnswer).mockReturnValue(new Promise(r => { resolve = r; }));
        const first = c.handleSubmitClick(201);
        await c.handleSubmitClick(201);
        expect(api.submitAnswer).toHaveBeenCalledTimes(1);
        resolve(result);
        await first;
    });
    it.each(["win", "lose"] as const)("navigates according to the server's %s result", async outcome => {
        const c = createController();
        await c.startGame("run");
        vi.mocked(api.submitAnswer).mockResolvedValue({ ...result, result: outcome, correct: outcome === "win" });
        await c.handleSubmitClick(200);
        expect(c.getView().endGameText).toHaveBeenCalledWith(outcome === "win");
        expect(switchToScreen).toHaveBeenCalledWith({ type: outcome === "win" ? "map" : "menu" });
    });
    it("returns to map on network failure without retrying the answer", async () => {
        const c = createController();
        await c.startGame("run");
        vi.mocked(api.submitAnswer).mockRejectedValue(new Error("offline"));
        await c.handleSubmitClick(200);
        expect(alert).toHaveBeenCalledWith("offline");
        expect(switchToScreen).toHaveBeenCalledWith({ type: "map" });
        expect(api.submitAnswer).toHaveBeenCalledTimes(1);
    });
    it("ignores a response received after leaving the screen", async () => {
        const c = createController();
        await c.startGame("run");
        let resolve!: (value: api.AnswerResponse) => void;
        vi.mocked(api.submitAnswer).mockReturnValue(new Promise(r => { resolve = r; }));
        const pending = c.handleSubmitClick(200);
        c.hide();
        resolve(result);
        await pending;
        expect(c.getModel().getPlayerHealth()).toBe(100);
        expect(switchToScreen).not.toHaveBeenCalled();
    });
});

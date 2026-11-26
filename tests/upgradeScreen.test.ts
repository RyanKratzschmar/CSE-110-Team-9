// @vitest-environment jsdom
import "vitest-canvas-mock";
import { GameSession } from "../src/GameSession";
import { finishCombat } from "../backend/game/GameManager";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Konva from "konva";
import { UpgradeMinigameScreenModel } from "../src/screens/UpgradeMinigameScreen/UpgradeMinigameScreenModel";
import type { UpgradeMinigameState } from "../src/screens/UpgradeMinigameScreen/UpgradeMinigameScreenModel";
import { UpgradeMinigameScreenView } from "../src/screens/UpgradeMinigameScreen/UpgradeMinigameScreenView";
import { UpgradeMinigameScreenController } from "../src/screens/UpgradeMinigameScreen/UpgradeMinigameScreenController";
import { CombatMainScreenModel } from "../src/screens/CombatMainScreen/CombatMainScreenModel";

//Reads "a × b = ?" and returns a * b
function solve(problemText: string): number {
    const [a, b] = problemText.match(/\d+/g)!.map(Number);
    return a * b;
}

//Puts the model in the solving phase with a 60 second round
function startedModel(): UpgradeMinigameScreenModel {
    const model = new UpgradeMinigameScreenModel();
    model.startRound(60);
    return model;
}

//Finds the text node with this exact text inside the view
function findText(view: UpgradeMinigameScreenView, text: string): Konva.Text {
    const node = view.getGroup().find<Konva.Text>("Text").find((t) => t.text() === text);
    if (!node) {
        throw new Error(`No text "${text}" found`);
    }
    return node;
}

//Builds a full state for the view
function makeState(patch: Partial<UpgradeMinigameState>): UpgradeMinigameState {
    return { ...new UpgradeMinigameScreenModel().getState(), ...patch };
}

describe("UpgradeMinigameScreenModel", () => {
    it("a correct answer counts it and loads a new problem", () => {
        const model = startedModel();
        model.submitAnswer(solve(model.getState().problemText));

        const state = model.getState();
        expect(state.correctCount).toBe(1);
        expect(state.attemptedCount).toBe(1);
        expect(state.feedback).toBe("correct");
        expect(state.awaitingNext).toBe(false);
    });

    it("a wrong answer reveals the answer, keeps the problem, and waits for Next", () => {
        const model = startedModel();
        const problem = model.getState().problemText;
        const answer = solve(problem);
        model.submitAnswer(answer + 1);

        const state = model.getState();
        expect(state.correctCount).toBe(0);
        expect(state.attemptedCount).toBe(1);
        expect(state.feedback).toBe("incorrect");
        expect(state.revealedAnswer).toBe(problem.replace("?", String(answer)));
        expect(state.problemText).toBe(problem);
        expect(state.awaitingNext).toBe(true);

        model.submitAnswer(answer);
        expect(model.getState().attemptedCount).toBe(1);
    });

    it("nextQuestion clears the reveal and goes back to answering", () => {
        const model = startedModel();
        model.submitAnswer(solve(model.getState().problemText) + 1);
        model.nextQuestion();

        const state = model.getState();
        expect(state.awaitingNext).toBe(false);
        expect(state.feedback).toBeNull();
        expect(state.revealedAnswer).toBe("");
    });
});

describe("UpgradeMinigameScreenController", () => {
    const switchToScreen = vi.fn();
    let controller: UpgradeMinigameScreenController;
    let session: GameSession;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
        vi.spyOn(window, "alert").mockImplementation(() => {});
        switchToScreen.mockReset();
        session = new GameSession();
        for (let i = 0; i < 3; i++) finishCombat(session.state, "win");
        controller = new UpgradeMinigameScreenController({ switchToScreen }, new CombatMainScreenModel(), session);
        controller.startUpgradeMinigame();
        vi.spyOn(Math, "random").mockReturnValue(0.1);
        controller["handleStart"]();
    });

    afterEach(() => {
        controller.hide();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("loads the question from the shared local challenge", () => {
        expect(session.state.upgradeMinigame).not.toBeNull();
        expect(controller["model"].getState()).toMatchObject({ phase: "solving", problemText: "1 \u00D7 1 = ?", timeLeft: 60 });
    });

    it("checks answers locally and retries the same question after a mistake", () => {
        controller["handleSubmit"]("2");
        expect(controller["model"].getState()).toMatchObject({ feedback: "incorrect", awaitingNext: true, correctCount: 0 });
        controller["handleNext"]();
        controller["handleSubmit"]("1");
        expect(session.state.upgradeMinigame!.getCorrectAnswers()).toBe(1);
        expect(controller["questionId"]).toBe(2);
        expect(controller["model"].getState()).toMatchObject({ feedback: "correct", correctCount: 1, attemptedCount: 2 });
    });

    it("rejects invalid input without consuming the question", () => {
        controller["handleSubmit"]("");
        expect(controller["model"].getState().feedback).toBe("invalid");
        expect(session.state.upgradeMinigame!.currentQuestion().questionId).toBe(1);
    });

    it("does not grant a reward below ten correct answers", () => {
        for (let i = 0; i < 9; i++) controller["handleSubmit"]("1");
        vi.advanceTimersByTime(60_000);
        expect(session.state.player.attack).toBe(10);
        expect(session.state.upgradeClaimedLevel).toBeNull();
        expect(switchToScreen).not.toHaveBeenCalled();
        expect(findText(controller.getView(), "You need 10 correct answers within 60 seconds to earn an upgrade.").isVisible()).toBe(true);
        expect(window.alert).not.toHaveBeenCalled();
    });

    it("says the attempt was already made when restarting after a failed round", () => {
        vi.advanceTimersByTime(60_000);
        controller["handleLeave"]();
        controller.startUpgradeMinigame();
        controller["handleStart"]();
        expect(controller["model"].getState().phase).toBe("complete");
        expect(findText(controller.getView(), "Upgrade attempt has already been made. Please try again on the next floor.").isVisible()).toBe(true);
    });

    it("says the upgrade was already claimed when restarting after a successful round", () => {
        for (let i = 0; i < 10; i++) controller["handleSubmit"]("1");
        vi.advanceTimersByTime(60_000);
        controller["handleLeave"]();
        controller.startUpgradeMinigame();
        controller["handleStart"]();
        expect(findText(controller.getView(), "Upgrade has already been claimed for this floor.").isVisible()).toBe(true);
    });

    it("grants the reward once using the shared player and preserves HP", () => {
        session.state.player.takeDamage(20);
        const hp = session.state.player.hp;
        for (let i = 0; i < 10; i++) controller["handleSubmit"]("1");
        vi.advanceTimersByTime(60_000);
        controller["finishRound"]();
        expect(session.state.player.attack).toBe(12);
        expect(session.state.player.defense).toBeCloseTo(0.11);
        expect(session.state.player.hp).toBe(hp);
        expect(session.state.upgradeClaimedLevel).toBe(1);
        expect(controller["combatModel"].getPlayerHealth()).toBe(hp);
        expect(findText(controller.getView(), "10 → 12  (+2)").isVisible()).toBe(true);
        expect(findText(controller.getView(), "0.10 → 0.11  (+0.01)").isVisible()).toBe(true);
        expect(findText(controller.getView(), "0 → 10  (+10)").isVisible()).toBe(true);
        expect(findText(controller.getView(), "Your gear has been upgraded!").isVisible()).toBe(true);
        expect(switchToScreen).not.toHaveBeenCalled();
        expect(window.alert).not.toHaveBeenCalled();
        controller["handleLeave"]();
        expect(switchToScreen).toHaveBeenCalledWith({ type: "rest" });
    });

    it("leaving midway and reopening starts a fresh round", () => {
        controller["handleSubmit"]("1");
        const game = session.state.upgradeMinigame;
        controller.hide();
        expect(session.state.upgradeMinigame).toBeNull();
        vi.advanceTimersByTime(5_000);
        controller.startUpgradeMinigame();
        controller["handleStart"]();
        expect(session.state.upgradeMinigame).not.toBe(game);
        expect(controller["model"].getState()).toMatchObject({ correctCount: 0, attemptedCount: 0, timeLeft: 60 });
    });

    it("leaving before the timer ends resets progress even after ten correct answers", () => {
        for (let i = 0; i < 10; i++) controller["handleSubmit"]("1");
        controller["handleLeave"]();
        expect(session.state.upgradeMinigame).toBeNull();
        expect(session.state.upgradeClaimedLevel).toBeNull();
        expect(session.state.player.attack).toBe(10);
        controller.startUpgradeMinigame();
        controller["handleStart"]();
        expect(controller["model"].getState()).toMatchObject({ phase: "solving", correctCount: 0, attemptedCount: 0, timeLeft: 60 });
    });

    it("Leave goes back to the rest stop and stops the displayed timer", () => {
        vi.advanceTimersByTime(5_000);
        controller["handleLeave"]();
        const timeLeft = controller["model"].getState().timeLeft;
        vi.advanceTimersByTime(10_000);

        expect(switchToScreen).toHaveBeenCalledWith({ type: "rest" });
        expect(controller["model"].getState().timeLeft).toBe(timeLeft);
        expect(session.state.upgradeClaimedLevel).toBeNull();
    });

    it("refuses upgrades outside a rest stop", () => {
        session.newGame();
        controller.startUpgradeMinigame();
        controller["handleStart"]();
        expect(session.state.upgradeMinigame).toBeNull();
        expect(findText(controller.getView(), "The current stop is not a rest stop").isVisible()).toBe(true);
        expect(window.alert).not.toHaveBeenCalled();
    });
});

describe("UpgradeMinigameScreenView", () => {
    const handlers = { onStart: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn(), onLeave: vi.fn() };
    let view: UpgradeMinigameScreenView;

    beforeEach(() => {
        view = new UpgradeMinigameScreenView(handlers);
        view.show();
    });

    afterEach(() => {
        view.hide();
    });

    it("shows the right footer buttons for each phase", () => {
        view.render(makeState({ phase: "ready" }));
        expect(view.getGroup().find<Konva.Text>("Text").some((t) => t.text() === "Back")).toBe(false);
        expect(findText(view, "Leave").isVisible()).toBe(true);
        expect(findText(view, "Exit").isVisible()).toBe(false);

        view.render(makeState({ phase: "solving", problemText: "7 × 8 = ?" }));
        expect(findText(view, "Leave").isVisible()).toBe(true);
        expect(findText(view, "Exit").isVisible()).toBe(false);

        view.render(makeState({ phase: "complete" }));
        expect(findText(view, "Leave").isVisible()).toBe(false);
        expect(findText(view, "Exit").isVisible()).toBe(true);
    });

    it("swaps Submit for Next and shows the correct answer after a wrong answer", () => {
        const solving = { phase: "solving" as const, problemText: "7 × 8 = ?" };

        view.render(makeState(solving));
        expect(findText(view, "Submit").isVisible()).toBe(true);
        expect(findText(view, "Next").isVisible()).toBe(false);

        view.render(makeState({ ...solving, feedback: "incorrect", revealedAnswer: "7 × 8 = 56", awaitingNext: true }));
        expect(findText(view, "Submit").isVisible()).toBe(false);
        expect(findText(view, "Next").isVisible()).toBe(true);
        expect(findText(view, "Incorrect answer! 7 × 8 = 56").isVisible()).toBe(true);
    });

    it("shows the weapon, armor, and potion changes once the upgrade is applied", () => {
        const outcome = {
            weapon: { statBefore: 5, statAfter: 7 },
            armor: { statBefore: 0.1, statAfter: 0.25 },
            potion: { statBefore: 10, statAfter: 12 }
        };

        view.render(makeState({ phase: "complete", outcomeStatus: "loading" }));
        expect(findText(view, "Applying upgrades...").isVisible()).toBe(true);

        view.render(makeState({ phase: "complete", outcomeStatus: "ready", outcome }));
        expect(findText(view, "5 → 7  (+2)").isVisible()).toBe(true);
        expect(findText(view, "0.10 → 0.25  (+0.15)").isVisible()).toBe(true);
        expect(findText(view, "10 → 12  (+2)").isVisible()).toBe(true);
        expect(findText(view, "Your gear has been upgraded!").isVisible()).toBe(true);
    });

    it("sizes the HP bar to the player's health", () => {
        view.render(makeState({ playerHp: 50, playerMaxHp: 100 }));
        const healthBar = view.getGroup().find<Konva.Rect>("Rect").find((r) => r.fill() === "#0bba14");
        expect(healthBar?.width()).toBe(200);

        view.render(makeState({ playerHp: 0, playerMaxHp: 100 }));
        expect(healthBar?.width()).toBe(0);
    });
});

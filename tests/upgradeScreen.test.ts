// @vitest-environment jsdom
import "vitest-canvas-mock";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Konva from "konva";
import { UpgradeMinigameScreenModel } from "../src/screens/UpgradeMinigameScreen/UpgradeMinigameScreenModel";
import type { UpgradeMinigameState } from "../src/screens/UpgradeMinigameScreen/UpgradeMinigameScreenModel";
import { UpgradeMinigameScreenView } from "../src/screens/UpgradeMinigameScreen/UpgradeMinigameScreenView";
import { UpgradeMinigameScreenController } from "../src/screens/UpgradeMinigameScreen/UpgradeMinigameScreenController";
import type { UpgradeService } from "../src/screens/UpgradeMinigameScreen/UpgradeService";
import { CombatMainScreenModel } from "../src/screens/CombatMainScreen/CombatMainScreenModel";

//Reads "a × b = ?" and returns a * b
function solve(problemText: string): number {
    const [a, b] = problemText.match(/\d+/g)!.map(Number);
    return a * b;
}

//Puts the model in the solving phase with a 60 second round
function startedModel(): UpgradeMinigameScreenModel {
    const model = new UpgradeMinigameScreenModel();
    model.chooseUpgrade("weapon");
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
    const applyUpgrade = vi.fn();
    let controller: UpgradeMinigameScreenController;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
        switchToScreen.mockReset();
        applyUpgrade.mockReset();
        const service: UpgradeService = { applyUpgrade };
        const screenSwitcher = {
            switchToScreen,
            startNewGame: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        };
        controller = new UpgradeMinigameScreenController(screenSwitcher, new CombatMainScreenModel(), service);
        controller.startUpgradeMinigame();
    });

    afterEach(() => {
        controller.hide();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("ends the round after 60 seconds and shows the upgrade result", async () => {
        applyUpgrade.mockResolvedValue({ statBefore: 5, statAfter: 7 });
        controller["handleChoose"]("weapon");
        controller["handleStart"]();

        await vi.advanceTimersByTimeAsync(60_000);

        expect(applyUpgrade).toHaveBeenCalledWith({ upgradeType: "weapon", correctCount: 0, attemptedCount: 0 });
        const state = controller["model"].getState();
        expect(state.phase).toBe("complete");
        expect(state.outcomeStatus).toBe("ready");
        expect(state.statBefore).toBe(5);
        expect(state.statAfter).toBe(7);
    });

    it("shows an error when the upgrade service fails", async () => {
        applyUpgrade.mockRejectedValue(new Error("server down"));
        vi.spyOn(console, "error").mockImplementation(() => {});
        controller["handleChoose"]("armor");
        controller["handleStart"]();

        await vi.advanceTimersByTimeAsync(60_000);

        expect(controller["model"].getState().outcomeStatus).toBe("error");
    });

    it("Leave goes to the map and stops the timer", async () => {
        controller["handleChoose"]("potion");
        controller["handleStart"]();
        await vi.advanceTimersByTimeAsync(5_000);

        controller["handleLeave"]();
        const timeLeft = controller["model"].getState().timeLeft;
        await vi.advanceTimersByTimeAsync(10_000);

        expect(switchToScreen).toHaveBeenCalledWith({ type: "map" });
        expect(controller["model"].getState().timeLeft).toBe(timeLeft);
        expect(applyUpgrade).not.toHaveBeenCalled();
    });
});

describe("UpgradeMinigameScreenView", () => {
    const handlers = { onChoose: vi.fn(), onStart: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn(), onBack: vi.fn(), onLeave: vi.fn() };
    let view: UpgradeMinigameScreenView;

    beforeEach(() => {
        view = new UpgradeMinigameScreenView(handlers);
        view.show();
    });

    afterEach(() => {
        view.hide();
    });

    it("shows the right footer buttons for each phase", () => {
        view.render(makeState({ phase: "choose" }));
        expect(findText(view, "Back").isVisible()).toBe(true);
        expect(findText(view, "Leave").isVisible()).toBe(true);
        expect(findText(view, "Exit").isVisible()).toBe(false);

        view.render(makeState({ phase: "solving", upgradeType: "weapon", problemText: "7 × 8 = ?" }));
        expect(findText(view, "Back").isVisible()).toBe(false);
        expect(findText(view, "Leave").isVisible()).toBe(true);

        view.render(makeState({ phase: "complete", upgradeType: "weapon" }));
        expect(findText(view, "Leave").isVisible()).toBe(false);
        expect(findText(view, "Exit").isVisible()).toBe(true);
    });

    it("swaps Submit for Next and shows the correct answer after a wrong answer", () => {
        const solving = { phase: "solving" as const, upgradeType: "weapon" as const, problemText: "7 × 8 = ?" };

        view.render(makeState(solving));
        expect(findText(view, "Submit").isVisible()).toBe(true);
        expect(findText(view, "Next").isVisible()).toBe(false);

        view.render(makeState({ ...solving, feedback: "incorrect", revealedAnswer: "7 × 8 = 56", awaitingNext: true }));
        expect(findText(view, "Submit").isVisible()).toBe(false);
        expect(findText(view, "Next").isVisible()).toBe(true);
        expect(findText(view, "Incorrect answer! 7 × 8 = 56").isVisible()).toBe(true);
    });

    it("sizes the HP bar to the player's health", () => {
        view.render(makeState({ playerHp: 50, playerMaxHp: 100 }));
        const healthBar = view.getGroup().find<Konva.Rect>("Rect").find((r) => r.fill() === "#0bba14");
        expect(healthBar?.width()).toBe(200);

        view.render(makeState({ playerHp: 0, playerMaxHp: 100 }));
        expect(healthBar?.width()).toBe(0);
    });
});

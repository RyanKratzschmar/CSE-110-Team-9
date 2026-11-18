// Tests the upgrade minigame's timer, answer checking, and question progression.
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpgradeMinigame } from "../backend/game/UpgradeMinigame";
import { Player } from "../backend/game/Player";

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe("UpgradeMinigame", () => {
    it("scores a correct answer, advances the question, and rejects replay", () => {
        vi.useFakeTimers();
        vi.spyOn(Math, "random").mockReturnValue(0.1);
        const game = new UpgradeMinigame();

        expect(game.submitAnswer(1, 1)).toEqual({
            questionId: 1,
            correct: true,
            correctAnswer: 1,
            correctAnswers: 1,
            remainingTime: 60_000,
        });
        expect(game.currentQuestion().questionId).toBe(2);
        expect(() => game.submitAnswer(1, 1))
            .toThrow("Question is no longer current");
        expect(game.getCorrectAnswers()).toBe(1);
        expect(game.currentQuestion().questionId).toBe(2);
    });

    it("reveals the answer after a mistake and allows retrying the same question", () => {
        vi.useFakeTimers();
        vi.spyOn(Math, "random").mockReturnValue(0.1);
        const game = new UpgradeMinigame();
        const question = game.currentQuestion();

        expect(game.submitAnswer(2, question.questionId)).toMatchObject({
            correct: false,
            correctAnswer: 1,
            correctAnswers: 0,
        });
        expect(game.currentQuestion()).toEqual(question);
        expect(game.getCorrectAnswers()).toBe(0);
        expect(game.submitAnswer(1, question.questionId).correct).toBe(true);
        expect(game.getCorrectAnswers()).toBe(1);
        expect(game.currentQuestion().questionId).toBe(2);
    });

    it.each([NaN, Infinity, -Infinity])("rejects invalid answer %s without consuming the question", (answer) => {
        vi.useFakeTimers();
        vi.spyOn(Math, "random").mockReturnValue(0.1);
        const game = new UpgradeMinigame();
        const question = game.currentQuestion();

        expect(() => game.submitAnswer(answer, question.questionId))
            .toThrow("Answer must be a finite number");
        expect(game.currentQuestion()).toEqual(question);
        expect(game.getCorrectAnswers()).toBe(0);
        expect(game.submitAnswer(1, question.questionId).correct).toBe(true);
    });

    it("accepts an answer just before expiration without resetting the deadline", () => {
        vi.useFakeTimers();
        vi.spyOn(Math, "random").mockReturnValue(0.1);
        const game = new UpgradeMinigame();

        vi.advanceTimersByTime(59_999);
        expect(game.submitAnswer(1, 1)).toMatchObject({
            correct: true,
            remainingTime: 1,
        });
        vi.advanceTimersByTime(1);
        expect(game.isFinished()).toBe(true);
    });

    it.each([60_000, 65_000])("rejects submissions after %s milliseconds without changing state", (elapsed) => {
        vi.useFakeTimers();
        vi.spyOn(Math, "random").mockReturnValue(0.1);
        const game = new UpgradeMinigame();
        const question = game.currentQuestion();

        vi.advanceTimersByTime(elapsed);
        expect(() => game.submitAnswer(1, question.questionId))
            .toThrow("The minigame has ended");
        expect(game.getCorrectAnswers()).toBe(0);
        expect(game.currentQuestion()).toEqual(question);
    });

    it("starts with 60 seconds and no correct answers", () => {
        vi.useFakeTimers();

        const game = new UpgradeMinigame();

        expect(game.getRemainingTime()).toBe(60_000);
        expect(game.isFinished()).toBe(false);
        expect(game.getCorrectAnswers()).toBe(0);
    });

    it("expires at 60 seconds and never returns negative time", () => {
        vi.useFakeTimers();

        const game = new UpgradeMinigame();

        vi.advanceTimersByTime(59_999);
        expect(game.getRemainingTime()).toBe(1);
        expect(game.isFinished()).toBe(false);

        vi.advanceTimersByTime(1);
        expect(game.getRemainingTime()).toBe(0);
        expect(game.isFinished()).toBe(true);

        vi.advanceTimersByTime(5_000);
        expect(game.getRemainingTime()).toBe(0);
    });

    it("preserves the question and deadline across reads", () => {
        vi.useFakeTimers();

        const game = new UpgradeMinigame();
        const first = game.currentQuestion();

        vi.advanceTimersByTime(1_000);

        expect(game.currentQuestion()).toEqual(first);
        expect(first.questionId).toBe(1);
        expect(first.question).toEqual(expect.any(String));
        expect(first).not.toHaveProperty("answer");
        expect(game.getRemainingTime()).toBe(59_000);
    });

    it("upgrades attack and defense without changing HP", () => {
        const player = new Player(100, 10, 0.1);
        player.takeDamage(20);
        const hpBefore = player.hp;

        player.applyUpgrade();

        expect(player.attack).toBe(12);
        expect(player.defense).toBeCloseTo(0.11);
        expect(player.hp).toBe(hpBefore);
        expect(player.maxHp).toBe(100);
    });

    it("caps upgraded defense at 99 percent", () => {
        const player = new Player(100, 10, 0.95);

        player.applyUpgrade();

        expect(player.defense).toBe(0.99);
    })
});

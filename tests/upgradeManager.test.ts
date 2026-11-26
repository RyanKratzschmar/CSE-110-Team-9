import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameState } from "../backend/game/GameState";
import { finishCombat, finishRest, GameFlowError } from "../backend/game/GameManager";
import { claimUpgrade, startUpgradeMinigame } from "../backend/game/UpgradeManager";
import type { UpgradeMinigame } from "../backend/game/UpgradeMinigame";

function reachRest(state: GameState): void {
    for (let i = 0; i < 3; i++) finishCombat(state, "win");
}

function answerCorrectly(game: UpgradeMinigame, count = 10): void {
    for (let i = 0; i < count; i++) {
        game.submitAnswer(1, game.currentQuestion().questionId);
    }
}

beforeEach(() => {
    vi.useFakeTimers();
    // Every question is 1*1= ?.
    vi.spyOn(Math, "random").mockReturnValue(0.1);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe("UpgradeManager", () => {
    it("rejects starting and claiming at a combat stop", () => {
        const state = new GameState();
        const before = state.toJSON();
        expect(() => startUpgradeMinigame(state)).toThrow(GameFlowError);
        expect(() => claimUpgrade(state)).toThrow(GameFlowError);
        expect(state.upgradeMinigame).toBeNull();
        expect(state.toJSON()).toEqual(before);
    });

    it("reuses the session without resetting its timer or score", () => {
        const state = new GameState();
        reachRest(state);
        const game = startUpgradeMinigame(state);
        answerCorrectly(game, 3);
        vi.advanceTimersByTime(5_000);
        expect(startUpgradeMinigame(state)).toBe(game);
        expect(game.getRemainingTime()).toBe(55_000);
        expect(game.getCorrectAnswers()).toBe(3);
        expect(state.upgradeMinigameLevel).toBe(1);
    });

    it("rejects a claim without a session", () => {
        const state = new GameState();
        reachRest(state);
        const before = state.toJSON();
        expect(() => claimUpgrade(state)).toThrow("No minigame for this level");
        expect(state.upgradeClaimedLevel).toBeNull();
        expect(state.toJSON()).toEqual(before);
    });

    it("rejects nine correct answers and awards the upgrade after the tenth", () => {
        const state = new GameState();
        reachRest(state);
        state.player.takeDamage(20);
        const before = state.toJSON().player;
        const game = startUpgradeMinigame(state);
        expect(state.player.potionHealingBonus).toBe(0);
        answerCorrectly(game, 9);
        expect(() => claimUpgrade(state)).toThrow("Answer 10 questions correctly first");
        expect(state.toJSON().player).toEqual(before);
        expect(state.upgradeClaimedLevel).toBeNull();
        expect(state.player.potionHealingBonus).toBe(0);

        answerCorrectly(game, 1);
        claimUpgrade(state);
        expect(state.player.attack).toBe(before.attack + 2);
        expect(state.player.potionHealingBonus).toBe(10);
        expect(state.player.defense).toBeCloseTo(before.defense * 1.1);
        expect(state.player.hp).toBe(before.hp);
        expect(state.player.maxHp).toBe(before.maxHp);
        expect(state.upgradeClaimedLevel).toBe(1);
    });

    it("rejects duplicate claims and restarting after claiming", () => {
        const state = new GameState();
        reachRest(state);
        answerCorrectly(startUpgradeMinigame(state));
        claimUpgrade(state);
        const afterReward = state.toJSON();
        expect(() => claimUpgrade(state)).toThrow("Upgrade has already been claimed for this floor.");
        expect(() => startUpgradeMinigame(state)).toThrow("Upgrade has already been claimed for this floor.");
        expect(state.toJSON()).toEqual(afterReward);
        expect(state.player.potionHealingBonus).toBe(10);
    });

    it("allows claiming a score earned before expiration after the timer ends", () => {
        const state = new GameState();
        reachRest(state);
        answerCorrectly(startUpgradeMinigame(state));
        vi.advanceTimersByTime(60_000);
        claimUpgrade(state);
        expect(state.player.attack).toBe(12);
        expect(state.upgradeClaimedLevel).toBe(1);
    });

    it("cannot earn the missing tenth answer after expiration", () => {
        const state = new GameState();
        reachRest(state);
        const game = startUpgradeMinigame(state);
        answerCorrectly(game, 9);
        vi.advanceTimersByTime(60_000);
        const before = state.toJSON();
        expect(startUpgradeMinigame(state)).toBe(game);
        expect(() => game.submitAnswer(1, game.currentQuestion().questionId))
            .toThrow("The minigame has ended");
        expect(() => claimUpgrade(state)).toThrow("Answer 10 questions correctly first");
        expect(state.toJSON()).toEqual(before);
    });

    it("rejects an old level's score and starts a fresh session", () => {
        const state = new GameState();
        reachRest(state);
        const oldGame = startUpgradeMinigame(state);
        answerCorrectly(oldGame);
        finishRest(state);
        reachRest(state);
        expect(() => claimUpgrade(state)).toThrow("No minigame for this level");
        expect(state.player.attack).toBe(10);
        const newGame = startUpgradeMinigame(state);
        expect(newGame).not.toBe(oldGame);
        expect(newGame.getCorrectAnswers()).toBe(0);
        expect(state.upgradeMinigameLevel).toBe(2);
        expect(() => claimUpgrade(state)).toThrow("Answer 10 questions correctly first");
    });

    it("permits another earned upgrade in a new level", () => {
        const state = new GameState();
        reachRest(state);
        answerCorrectly(startUpgradeMinigame(state));
        claimUpgrade(state);
        finishRest(state);
        reachRest(state);
        answerCorrectly(startUpgradeMinigame(state));
        claimUpgrade(state);
        expect(state.player.attack).toBe(14);
        expect(state.player.potionHealingBonus).toBe(20);
        expect(state.player.defense).toBeCloseTo(0.1 * 1.1 * 1.1);
        expect(state.upgradeClaimedLevel).toBe(2);
    });

    it("rejects starting and claiming after game over even with an earned score", () => {
        const state = new GameState();
        reachRest(state);
        answerCorrectly(startUpgradeMinigame(state));
        state.gameOver = true;
        const before = state.toJSON();
        expect(() => startUpgradeMinigame(state)).toThrow("The game is over");
        expect(() => claimUpgrade(state)).toThrow("The game is over");
        expect(state.toJSON()).toEqual(before);
        expect(state.upgradeClaimedLevel).toBeNull();
    });
});

import type { GameState } from "./GameState";
import { GameFlowError, requireCurrentStop } from "./GameManager";
import { UpgradeMinigame } from "./UpgradeMinigame";

export function startUpgradeMinigame(
    state: GameState
): UpgradeMinigame {
    requireCurrentStop(state, "rest");

    const level = state.level.number;

    if (state.upgradeClaimedLevel === level) {
        throw new GameFlowError("Upgrade already claimed this level");
    }

    const existing = state.upgradeMinigame;

    if (
        existing !== null &&
        state.upgradeMinigameLevel === level
    ) {
        return existing;
    }

    const game = new UpgradeMinigame();

    state.upgradeMinigame = game;
    state.upgradeMinigameLevel = level;

    return game;
}

export function claimUpgrade(state: GameState): void {
    requireCurrentStop(state, "rest");

    const level = state.level.number;

    if (state.upgradeClaimedLevel === level) {
        throw new GameFlowError("Upgrade already claimed this level");
    }

    const game = state.upgradeMinigame;

    if(
        game === null ||
        state.upgradeMinigameLevel !== level
    ) {
        throw new GameFlowError("No minigame for this level");
    }

    if (!game.hasEarnedUpgrade()) {
        throw new GameFlowError("Answer 10 questions correctly first");
    }

    state.player.applyUpgrade();
    state.upgradeClaimedLevel = level;
}

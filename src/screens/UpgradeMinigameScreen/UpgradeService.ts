import type { UpgradeType } from "./UpgradeMinigameScreenModel.ts";

export interface UpgradeRoundResult {
    readonly upgradeType: UpgradeType;
    readonly correctCount: number;
    readonly attemptedCount: number;
}

export interface UpgradeOutcome {
    readonly statBefore: number;
    readonly statAfter: number;
}

export interface UpgradeService {
    applyUpgrade(result: UpgradeRoundResult): Promise<UpgradeOutcome>;
}

export class PlaceholderUpgradeService implements UpgradeService {
    async applyUpgrade(_result: UpgradeRoundResult): Promise<UpgradeOutcome> {
        return { statBefore: 0, statAfter: 0 };
    }
}

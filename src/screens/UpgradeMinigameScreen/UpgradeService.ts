import type { UpgradeType } from "./UpgradeMinigameScreenModel.ts";

//What the frontend sends to the upgrade service when a round ends
export interface UpgradeRoundResult {
    readonly upgradeType: UpgradeType;
    readonly correctCount: number;
    readonly attemptedCount: number;
}

//What the upgrade service sends back so Section 4 can show the stat change
export interface UpgradeOutcome {
    readonly statBefore: number;
    readonly statAfter: number;
}

//The only part of the backend the upgrade screen knows about; the real API version implements this
export interface UpgradeService {
    applyUpgrade(result: UpgradeRoundResult): Promise<UpgradeOutcome>;
}

//Placeholder upgrade service used until the backend is connected
export class PlaceholderUpgradeService implements UpgradeService {
    async applyUpgrade(_result: UpgradeRoundResult): Promise<UpgradeOutcome> {
        return { statBefore: 0, statAfter: 0 };
    }
}

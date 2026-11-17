import type { UpgradeType } from "./UpgradeMinigameScreenModel.ts";

//What the frontend sends to the upgrade service when a round ends
export interface UpgradeRoundResult {
    readonly correctCount: number;
    readonly attemptedCount: number;
}

//How one stat changed after the round
export interface StatChange {
    readonly statBefore: number;
    readonly statAfter: number;
}

//What the upgrade service sends back: one stat change each for weapon, armor, and potion
export type UpgradeOutcome = Readonly<Record<UpgradeType, StatChange>>;

//The only part of the backend the upgrade screen knows about
export interface UpgradeService {
    applyUpgrade(result: UpgradeRoundResult): Promise<UpgradeOutcome>;
}

//Placeholder upgrade service used until the backend is connected
export class PlaceholderUpgradeService implements UpgradeService {
    async applyUpgrade(_result: UpgradeRoundResult): Promise<UpgradeOutcome> {
        const none = { statBefore: 0, statAfter: 0 };
        return { weapon: none, armor: none, potion: none };
    }
}

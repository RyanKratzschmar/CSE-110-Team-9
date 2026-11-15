import type { UpgradeOutcome } from "./UpgradeService";

export type UpgradePhase = "choose" | "ready" | "solving" | "complete";
export type UpgradeType = "weapon" | "armor" | "potion";
export type UpgradeFeedback = "correct" | "incorrect" | "invalid" | null;
export type UpgradeOutcomeStatus = "loading" | "ready" | "error";

export const UPGRADE_INFO = {
    weapon: { emoji: "⚔️", label: "Weapon", stat: "Attack" },
    armor: { emoji: "🛡️", label: "Armor", stat: "Defense" },
    potion: { emoji: "🧪", label: "Potion", stat: "Potion Effect" }
} as const;

export interface UpgradeMinigameState {
    readonly phase: UpgradePhase;
    readonly upgradeType: UpgradeType | null;
    readonly problemText: string;
    readonly timeLeft: number;
    readonly correctCount: number;
    readonly attemptedCount: number;
    readonly feedback: UpgradeFeedback;
    readonly outcomeStatus: UpgradeOutcomeStatus;
    readonly statBefore: number;
    readonly statAfter: number;
    readonly playerHp: number;
    readonly playerMaxHp: number;
}

export type UpgradeMinigameListener = (state: UpgradeMinigameState) => void;

const INITIAL_STATE: UpgradeMinigameState = {
    phase: "choose",
    upgradeType: null,
    problemText: "",
    timeLeft: 0,
    correctCount: 0,
    attemptedCount: 0,
    feedback: null,
    outcomeStatus: "loading",
    statBefore: 0,
    statAfter: 0,
    playerHp: 100,
    playerMaxHp: 100
};

export class UpgradeMinigameScreenModel {
    private state: UpgradeMinigameState = INITIAL_STATE;
    private readonly listeners = new Set<UpgradeMinigameListener>();
    private currentAnswer = 0;

    getState(): UpgradeMinigameState {
        return this.state;
    }

    subscribe(listener: UpgradeMinigameListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    reset(): void {
        this.currentAnswer = 0;
        this.setState({ ...INITIAL_STATE, playerHp: this.state.playerHp, playerMaxHp: this.state.playerMaxHp });
    }

    chooseUpgrade(type: UpgradeType): void {
        this.setState({ phase: "ready", upgradeType: type });
    }

    backToChoose(): void {
        this.setState({ phase: "choose", upgradeType: null});
    }

    startRound(seconds: number): void {
        this.setState({phase: "solving", timeLeft: seconds, correctCount: 0, attemptedCount: 0, feedback: null, problemText: this.nextProblem()});
    }

    tick(): void {
        if (this.state.timeLeft > 0) {
            this.setState({ timeLeft: this.state.timeLeft - 1 });
        }
    }

    submitAnswer(answer: number): void {
        if (this.state.phase !== "solving") {
            return;
        }
        
        const correct = answer === this.currentAnswer;
        this.setState({
            attemptedCount: this.state.attemptedCount + 1,
            correctCount: this.state.correctCount + (correct ? 1 : 0),
            feedback: correct ? "correct" : "incorrect",
            problemText: this.nextProblem()
        });
    }

    setFeedback(feedback: UpgradeFeedback): void {
        this.setState({ feedback });
    }

    finishRound(): void {
        this.setState({ phase: "complete", feedback: null, outcomeStatus: "loading" });
    }

    setUpgradeOutcome(outcome: UpgradeOutcome): void {
        this.setState({
            outcomeStatus: "ready",
            statBefore: outcome.statBefore,
            statAfter: outcome.statAfter
        });
    }

    setUpgradeError(): void {
        this.setState({ outcomeStatus: "error" });
    }

    setPlayerHealth(hp: number, maxHp: number): void {
        this.setState({ playerHp: hp, playerMaxHp: maxHp });
    }

    private nextProblem(): string {
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        this.currentAnswer = a * b;
        return `${a} × ${b} = ?`;   
    }

    private setState(patch: Partial<UpgradeMinigameState>): void {
        this.state = { ...this.state, ...patch };
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
}
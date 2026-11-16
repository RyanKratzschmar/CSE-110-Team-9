import type { UpgradeOutcome } from "./UpgradeService";

export type UpgradePhase = "choose" | "ready" | "solving" | "complete"; //The four phases of the screen: choose an upgrade, ready to start, solving problems, and upgrade complete
export type UpgradeType = "weapon" | "armor" | "potion";
export type UpgradeFeedback = "correct" | "incorrect" | "invalid" | null;
export type UpgradeOutcomeStatus = "loading" | "ready" | "error";

export const UPGRADE_INFO = {
    weapon: { emoji: "⚔️", label: "Weapon", stat: "Attack" },
    armor: { emoji: "🛡️", label: "Armor", stat: "Defense" },
    potion: { emoji: "🧪", label: "Potion", stat: "Potion Effect" }
} as const;

//Everything the view needs to draw the upgrade minigame
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
    readonly revealedAnswer: string;
    readonly awaitingNext: boolean;
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
    playerMaxHp: 100,
    revealedAnswer: "",
    awaitingNext: false
};

//Holds the upgrade minigame state (phase, chosen upgrade, problem, timer, score, and result) and notifies listeners when it changes
export class UpgradeMinigameScreenModel {
    private state: UpgradeMinigameState = INITIAL_STATE;
    private readonly listeners = new Set<UpgradeMinigameListener>();
    private currentAnswer = 0;

    //Returns the current state
    getState(): UpgradeMinigameState {
        return this.state;
    }

    //Registers a listener for state changes and returns a function that removes it
    subscribe(listener: UpgradeMinigameListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    //Goes back to the "choose an upgrade" phase, keeping the player's current health
    reset(): void {
        this.currentAnswer = 0;
        this.setState({ ...INITIAL_STATE, playerHp: this.state.playerHp, playerMaxHp: this.state.playerMaxHp });
    }

    //Saves the chosen upgrade and moves to the ready phase
    chooseUpgrade(type: UpgradeType): void {
        this.setState({ phase: "ready", upgradeType: type });
    }

    //Clears the chosen upgrade and returns to the choose phase
    backToChoose(): void {
        this.setState({ phase: "choose", upgradeType: null});
    }

    //Starts a new round: resets the score, sets the timer, and loads the first problem
    startRound(seconds: number): void {
        this.setState({ phase: "solving", timeLeft: seconds, correctCount: 0, attemptedCount: 0, feedback: null, problemText: this.nextProblem(), revealedAnswer: "", awaitingNext: false });
    }

    //Takes one second off the timer, never going below 0
    tick(): void {
        if (this.state.timeLeft > 0) {
            this.setState({ timeLeft: this.state.timeLeft - 1 });
        }
    }

    //Checks the answer: a correct one loads the next problem, a wrong one reveals the answer and waits for Next
    submitAnswer(answer: number): void {
        if (this.state.phase !== "solving" || this.state.awaitingNext) {
            return;
        }

        const correct = answer === this.currentAnswer;
        if (correct) {
            this.setState({
                attemptedCount: this.state.attemptedCount + 1,
                correctCount: this.state.correctCount + 1,
                feedback: "correct",
                revealedAnswer: "",
                problemText: this.nextProblem()
            });
        } else {
            this.setState({
                attemptedCount: this.state.attemptedCount + 1,
                feedback: "incorrect",
                revealedAnswer: this.state.problemText.replace("?", String(this.currentAnswer)),
                awaitingNext: true
            });
        }
    }

    //Clears the revealed answer and loads the next problem after the player presses Next
    nextQuestion(): void {
        if (this.state.phase !== "solving" || !this.state.awaitingNext) {
            return;
        }
        this.setState({
            awaitingNext: false,
            feedback: null,
            revealedAnswer: "",
            problemText: this.nextProblem()
        });
    }

    //Sets the message shown under the problem, or clears it with null
    setFeedback(feedback: UpgradeFeedback): void {
        this.setState({ feedback });
    }

    //Ends the round and waits for the upgrade result
    finishRound(): void {
        this.setState({ phase: "complete", feedback: null, outcomeStatus: "loading", awaitingNext: false });
    }

    //Saves the stat change sent back by the upgrade service
    setUpgradeOutcome(outcome: UpgradeOutcome): void {
        this.setState({
            outcomeStatus: "ready",
            statBefore: outcome.statBefore,
            statAfter: outcome.statAfter
        });
    }

    //Marks that the upgrade could not be applied
    setUpgradeError(): void {
        this.setState({ outcomeStatus: "error" });
    }

    //Updates the player's current and max health shown in the HP bar
    setPlayerHealth(hp: number, maxHp: number): void {
        this.setState({ playerHp: hp, playerMaxHp: maxHp });
    }

    //Makes a random 1-12 times-table problem, saves its answer, and returns the text to show
    private nextProblem(): string {
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        this.currentAnswer = a * b;
        return `${a} × ${b} = ?`;   
    }

    //Merges the patch into the state and notifies every listener
    private setState(patch: Partial<UpgradeMinigameState>): void {
        this.state = { ...this.state, ...patch };
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
}
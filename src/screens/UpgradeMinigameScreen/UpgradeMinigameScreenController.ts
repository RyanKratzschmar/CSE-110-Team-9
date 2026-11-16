import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { UpgradeMinigameScreenModel } from "./UpgradeMinigameScreenModel.ts";
import type { UpgradeType } from "./UpgradeMinigameScreenModel.ts";
import { UpgradeMinigameScreenView } from "./UpgradeMinigameScreenView.ts";
import { PlaceholderUpgradeService } from "./UpgradeService.ts";
import type { UpgradeService } from "./UpgradeService.ts";

const TIME_LIMIT_SECONDS = 60;

//Connects the upgrade minigame model and view, runs the timer, and handles button clicks
export class UpgradeMinigameScreenController extends ScreenController {
    private readonly screenSwitcher: ScreenSwitcher;
    private readonly upgradeService: UpgradeService;
    private readonly model = new UpgradeMinigameScreenModel();
    private readonly view: UpgradeMinigameScreenView;
    private readonly clickSound = new Audio("/click.mp3");
    private timerId: number | null = null;
    private roundId = 0;

    //Creates the view with its button handlers and redraws it whenever the model changes; the upgrade service defaults to a placeholder
    constructor(screenSwitcher: ScreenSwitcher, upgradeService: UpgradeService = new PlaceholderUpgradeService()) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.upgradeService = upgradeService;
        this.view = new UpgradeMinigameScreenView({
            onChoose: (type) => this.handleChoose(type),
            onStart: () => this.handleStart(),
            onSubmit: (answer) => this.handleSubmit(answer),
            onBack: () => this.handleBack(),
            onLeave: () => this.handleLeave(),
            onNext: () => this.handleNext(),
        });
        this.model.subscribe((state) => this.view.render(state));
        this.view.render(this.model.getState());
    }

    //Resets to the "choose an upgrade" phase and shows the screen
    startUpgradeMinigame(): void {
        this.roundId++;
        this.stopTimer();
        this.model.reset();
        this.show();
    }

    //Stops the timer so it doesn't keep running in the background, then hides the screen
    hide(): void {
        this.stopTimer();
        super.hide();
    }

    //Returns the upgrade minigame view
    getView(): UpgradeMinigameScreenView {
        return this.view;
    }

    //Updates the HP bar with the player's current and max health
    setPlayerHealth(hp: number, maxHp: number): void {
        this.model.setPlayerHealth(hp, maxHp);
    }

    //Plays the click sound and saves the chosen upgrade
    private handleChoose(type: UpgradeType): void {
        this.playClick();
        this.model.chooseUpgrade(type);
    }

    //Plays the click sound and starts the one-minute round
    private handleStart(): void {
        this.playClick();
        this.beginRound();
    }

    //Checks that the typed answer is a whole number, then sends it to the model
    private handleSubmit(rawAnswer: string): void {
        const state = this.model.getState();
        
        if (state.phase !== "solving" || state.timeLeft <= 0 || state.awaitingNext) {
            return;
        }
        
        const trimmed = rawAnswer.trim();
        const answer = Number(trimmed);

        if (trimmed === "" || !Number.isInteger(answer)) {
            this.model.setFeedback("invalid");
            return;
        }

        this.model.submitAnswer(answer);
    }

    //Plays the click sound and moves to the next problem after a wrong answer
    private handleNext(): void {
        const state = this.model.getState();
        
        if (state.phase !== "solving" || state.timeLeft <= 0 || !state.awaitingNext) {
            return;
        }
        
        this.playClick();
        this.model.nextQuestion();
    }

    //Back from the ready phase returns to the upgrade choices; Back from the choose phase leaves the screen
    private handleBack(): void {
        this.playClick();
        const phase = this.model.getState().phase;

        if (phase === "ready") {
            this.model.backToChoose();
        } else if (phase === "choose") {
            this.leaveScreen();
        }
    }

    //Plays the click sound and returns to the map (used by both Leave and Exit)
    private handleLeave(): void {
        this.playClick();
        this.leaveScreen();
    }

    //Starts a new round in the model and starts the countdown
    private beginRound(): void {
        this.model.startRound(TIME_LIMIT_SECONDS);
        this.startTimer();
    }

    //Counts down once per second and ends the round when time runs out
    private startTimer(): void {
        this.stopTimer();
        this.timerId = window.setInterval(() => {
            this.model.tick();
            if (this.model.getState().timeLeft <= 0) {
                this.stopTimer();
                void this.finishRound();
            }
        }, 1000);
    }

    //Stops the countdown if it is running
    private stopTimer(): void {
        if (this.timerId !== null) {
            window.clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    //Ends the round, asks the upgrade service for the result, and ignores replies that arrive after the player has left
    private async finishRound(): Promise<void> {
        const id = ++this.roundId;
        const state = this.model.getState();
        
        if (state.upgradeType === null) {
            return;
        }

        this.model.finishRound();

        try {
            const outcome = await this.upgradeService.applyUpgrade({
                upgradeType: state.upgradeType,
                correctCount: state.correctCount,
                attemptedCount: state.attemptedCount
            });
            if (id === this.roundId) {
                this.model.setUpgradeOutcome(outcome);
            }
        } catch (err) {
            console.error("Failed to apply upgrade", err);
            if (id === this.roundId) {
                this.model.setUpgradeError();
            }
        }
    }

    //Stops the timer, drops any pending upgrade reply, and returns to the map
    private leaveScreen(): void {
        this.roundId++;
        this.stopTimer();
        this.screenSwitcher.switchToScreen({ type: "map" });
    }

    //Plays the click sound
    private playClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play().catch(() => {});
    }
}

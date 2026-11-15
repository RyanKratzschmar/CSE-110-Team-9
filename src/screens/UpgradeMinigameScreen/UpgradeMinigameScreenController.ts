import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import { UpgradeMinigameScreenModel } from "./UpgradeMinigameScreenModel.ts";
import type { UpgradeType } from "./UpgradeMinigameScreenModel.ts";
import { UpgradeMinigameScreenView } from "./UpgradeMinigameScreenView.ts";
import { PlaceholderUpgradeService } from "./UpgradeService.ts";
import type { UpgradeService } from "./UpgradeService.ts";

const TIME_LIMIT_SECONDS = 60;

export class UpgradeMinigameScreenController extends ScreenController {
    private readonly screenSwitcher: ScreenSwitcher;
    private readonly upgradeService: UpgradeService;
    private readonly model = new UpgradeMinigameScreenModel();
    private readonly view: UpgradeMinigameScreenView;
    private readonly clickSound = new Audio("/click.mp3");
    private timerId: number | null = null;
    private roundId = 0;

    constructor(screenSwitcher: ScreenSwitcher, upgradeService: UpgradeService = new PlaceholderUpgradeService()) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.upgradeService = upgradeService;
        this.view = new UpgradeMinigameScreenView({
            onChoose: (type) => this.handleChoose(type),
            onStart: () => this.handleStart(),
            onSubmit: (answer) => this.handleSubmit(answer),
            onBack: () => this.handleBack(),
            onLeave: () => this.handleLeave()
        });
        this.model.subscribe((state) => this.view.render(state));
        this.view.render(this.model.getState());
    }

    startUpgradeMinigame(): void {
        this.roundId++;
        this.stopTimer();
        this.model.reset();
        this.show();
    }

    hide(): void {
        this.stopTimer();
        super.hide();
    }

    getView(): UpgradeMinigameScreenView {
        return this.view;
    }

    setPlayerHealth(hp: number, maxHp: number): void {
        this.model.setPlayerHealth(hp, maxHp);
    }

    private handleChoose(type: UpgradeType): void {
        this.playClick();
        this.model.chooseUpgrade(type);
    }

    private handleStart(): void {
        this.playClick();
        this.beginRound();
    }

    private handleSubmit(rawAnswer: string): void {
        const state = this.model.getState();
        
        if (state.phase !== "solving" || state.timeLeft <= 0) {
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

    private handleBack(): void {
        this.playClick();
        const phase = this.model.getState().phase;

        if (phase === "ready") {
            this.model.backToChoose();
        } else if (phase === "choose") {
            this.leaveScreen();
        }
    }

    private handleLeave(): void {
        this.playClick();
        this.leaveScreen();
    }

    private beginRound(): void {
        this.model.startRound(TIME_LIMIT_SECONDS);
        this.startTimer();
    }

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

    private stopTimer(): void {
        if (this.timerId !== null) {
            window.clearInterval(this.timerId);
            this.timerId = null;
        }
    }

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

    private leaveScreen(): void {
        this.roundId++;
        this.stopTimer();
        this.screenSwitcher.switchToScreen({ type: "map" });
    }

    private playClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play().catch(() => {});
    }
}
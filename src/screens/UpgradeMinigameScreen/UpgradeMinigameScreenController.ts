import { ScreenController } from "../../types";
import type { ScreenSwitcher } from "../../types";
import type { CombatMainScreenModel } from "../CombatMainScreen/CombatMainScreenModel.ts";
import { UpgradeMinigameScreenModel } from "./UpgradeMinigameScreenModel.ts";
import { UpgradeMinigameScreenView } from "./UpgradeMinigameScreenView.ts";
import type { GameSession } from "../../GameSession";
import { startUpgradeMinigame, claimUpgrade } from "../../../backend/game/UpgradeManager";
import { requireCurrentStop } from "../../../backend/game/GameManager";
import type { UpgradeMinigame } from "../../../backend/game/UpgradeMinigame";


//Connects the upgrade minigame model and view, runs the timer, and handles button clicks
export class UpgradeMinigameScreenController extends ScreenController {
    private readonly screenSwitcher: ScreenSwitcher;
    private readonly combatModel: CombatMainScreenModel;
    private readonly model = new UpgradeMinigameScreenModel();
    private readonly view: UpgradeMinigameScreenView;
    private readonly clickSound = new Audio("/click.mp3");
    private timerId: number | null = null;
    private roundId = 0;
    private game: UpgradeMinigame | null = null;
    private questionId: number | null = null;

    //Creates the view and redraws it whenever the model changes
    constructor(
        screenSwitcher: ScreenSwitcher,
        combatModel: CombatMainScreenModel,
        private readonly gameSession: GameSession
    ) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.combatModel = combatModel;
        this.view = new UpgradeMinigameScreenView({
            onStart: () => this.handleStart(),
            onSubmit: (answer) => this.handleSubmit(answer),
            onLeave: () => this.handleLeave(),
            onNext: () => this.handleNext(),
        });
        this.model.subscribe((state) => this.view.render(state));
        this.view.render(this.model.getState());
    }

    //Resets to the ready phase and shows the screen
    startUpgradeMinigame(): void {
        this.game = null;
        this.questionId = null;

        this.roundId++;
        this.stopTimer();
        this.model.reset();
        this.setPlayerHealth(this.combatModel.getPlayerHealth(), this.combatModel.getPlayerMaxHealth());
        this.show();
    }

    //Stops the timer so it doesn't keep running in the background, then hides the screen
    hide(): void {
        this.roundId++;
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

    // Start or resume the challenge belonging to the shared local game.
    private handleStart(): void {
        if (this.model.getState().phase !== "ready") return;
        try {
            const game = startUpgradeMinigame(this.gameSession.state);
            this.game = game;
            this.questionId = game.currentQuestion().questionId;
            this.model.loadSession({
                ...game.currentQuestion(),
                correctAnswers: game.getCorrectAnswers(),
                remainingTime: game.getRemainingTime(),
            });
            this.startTimer();
        } catch (error) {
            this.model.setResult(error instanceof Error ? error.message : "Could not start minigame", false);
        }
    }

    // The shared challenge owns correctness, score, and the time limit.
    private handleSubmit(rawAnswer: string): void {
        const state = this.model.getState();
        if (state.phase !== "solving" || state.awaitingNext || this.game === null || this.questionId === null) return;
        const answer = Number(rawAnswer.trim());
        if (rawAnswer.trim() === "" || !Number.isSafeInteger(answer)) {
            this.model.setFeedback("invalid");
            return;
        }
        try {
            requireCurrentStop(this.gameSession.state, "rest");
            if (this.game !== this.gameSession.state.upgradeMinigame) throw new Error("Start a new challenge first");
            const result = this.game.submitAnswer(answer, this.questionId);
            this.questionId = this.game.currentQuestion().questionId;
            this.model.applyAnswerResponse({
                ...result,
                remainingTime: this.game.getRemainingTime(),
                currentQuestion: this.game.currentQuestion(),
            });
        } catch (error) {
            if (this.game.isFinished()) this.finishRound();
            else {
                this.stopTimer();
                this.model.setResult(error instanceof Error ? error.message : "Could not check answer", false);
            }
        }
    }

    //Plays the click sound and moves to the next problem after a wrong answer
    private handleNext(): void {
        const state = this.model.getState();
        
        if (state.phase !== "solving" || state.timeLeft <= 0 || !state.awaitingNext) {
            return;
        }
        
        this.playClick();
        this.model.retryCurrentQuestion();
    }

    //Plays the click sound and returns to the map (used by both Leave and Exit)
    private handleLeave(): void {
        this.playClick();
        this.leaveScreen();
    }

    // Render remaining time from the challenge deadline, including after tab suspension.
    private startTimer(): void {
        this.stopTimer();
        this.timerId = window.setInterval(() => {
            if (this.game === null) return;
            this.model.setRemainingTime(this.game.getRemainingTime());
            if (this.game.isFinished()) this.finishRound();
        }, 250);
    }

    //Stops the countdown if it is running
    private stopTimer(): void {
        if (this.timerId !== null) {
            window.clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    // The shared GameState enforces ten correct answers and one claim per level.
    private finishRound(): void {
        if (this.model.getState().phase !== "solving" || this.game === null) return;
        this.stopTimer();
        this.model.finishRound();
        if (!this.game.hasEarnedUpgrade()) {
            this.model.setResult("You need 10 correct answers within 60 seconds to earn an upgrade.", false);
            return;
        }
        try {
            const player = this.gameSession.state.player;
            const attackBefore = player.attack;
            const defenseBefore = player.defense;
            const potionBonusBefore = player.potionHealingBonus;
            claimUpgrade(this.gameSession.state);
            this.combatModel.setPlayerHealth(player.hp);
            this.combatModel.setPlayerMaxHealth(player.maxHp);
            this.model.setUpgradeOutcome({
                weapon: { statBefore: attackBefore, statAfter: player.attack },
                armor: { statBefore: defenseBefore, statAfter: player.defense },
                potion: { statBefore: potionBonusBefore, statAfter: player.potionHealingBonus },
            });
        } catch (error) {
            this.model.setResult(error instanceof Error ? error.message : "Could not claim upgrade", false);
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

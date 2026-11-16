import type { WrongAnswerPopUpController } from "../../../frontend/src/wrongAnswerExplanationPopUp/controller/WrongAnswerPopUpController.ts";
import type { HintPopUpController } from "../../../frontend/src/hintPopUp/controller/HintPopUpController.ts";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { CombatMainScreenView } from "./CombatMainScreenView.ts";
import { CombatMainScreenModel } from "./CombatMainScreenModel.ts";
import { getCombat, submitAnswer } from "../../../frontend/src/api.ts";

export class CombatMainScreenController extends ScreenController {
    private model: CombatMainScreenModel;
    private view: CombatMainScreenView;
    private screenSwitcher: ScreenSwitcher;

    private clickSound: HTMLAudioElement;

    private explanationPopUp: WrongAnswerPopUpController;
    private hintPopUp: HintPopUpController;

    private runId: string | null = null;
    private submitting = false;
    private sessionVersion = 0;

    constructor(
        screenSwitcher: ScreenSwitcher,
        explanationPopUp: WrongAnswerPopUpController,
        hintPopUp: HintPopUpController
    ) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.explanationPopUp = explanationPopUp;
        this.hintPopUp = hintPopUp;

        this.model = new CombatMainScreenModel();
        this.view = new CombatMainScreenView(
            () => this.handleHintClick(),
            () => this.handleHintXClick(),
            () => this.handleAttackClick(),
            (answer) => { void this.handleSubmitClick(answer); },
            () => this.handleExplanationClick(),
            () => this.handlePotionClick()
        );

        this.clickSound = new Audio("/click.mp3");
    }

    handleAttackClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.view.solveEquation();

    }

    // Creates hint pop up
    handleHintClick(): void {
        this.clickSound.currentTime = 0;
        try {
            const promise = this.clickSound.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(() => {});
            }
        } catch {
            // Audio not supported in environment
        }

        this.hintPopUp.showLongMultiplicationHint(123, 45);
    }

    // Hides hint pop up
    handleHintXClick(): void {
        this.clickSound.currentTime = 0;
        try {
            const promise = this.clickSound.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(() => {});
            }
        } catch {
            // Audio not supported in environment
        }

        this.hintPopUp.close();
    }

    override hide(): void {
        this.sessionVersion += 1;
        this.submitting = false;
        if (this.hintPopUp?.isOpen()) {
            this.hintPopUp.close();
        }
        if (this.explanationPopUp?.isOpen()) {
            this.explanationPopUp.close();
        }
        super.hide();
    }

    // The keypad supplies the entered number through the view's submit callback.
    async handleSubmitClick(answer?: number): Promise<void> {
        if (this.submitting || this.runId === null) return;
        if (typeof answer !== "number" || !Number.isFinite(answer)) {
            alert("Enter a valid answer first.");
            return;
        }

        const runId = this.runId;
        const combatId = this.model.getCombatId();
        const questionId = this.model.getQuestionId();
        if (combatId === null || questionId === null) {
            alert("Load a fight first.");
            return;
        }

        const version = this.sessionVersion;
        this.submitting = true;
        try {
            const result = await submitAnswer(runId, combatId, questionId, answer);
            if (version !== this.sessionVersion) return;

            this.model.setPlayerHealth(result.playerHp);
            this.model.setEnemyCurrentHealth(result.enemyHp);
            this.view.setPlayerHealthBar(result.playerHp, this.model.getPlayerMaxHealth());
            this.view.updateEnemyHealthBar(result.enemyHp, this.model.getEnemyMaxHealth());

            alert(result.correct ? "Correct!" : `Incorrect. The correct answer is ${result.correctAnswer}.`);
            this.view.returnToCombat();

            if (result.result === "ongoing") {
                await this.loadFight(runId, version);
            } else {
                this.endFight(result.result === "win");
                alert(result.result === "win" ? "You won!" : "Game over.");
                this.screenSwitcher.switchToScreen({ type: result.result === "win" ? "map" : "menu" });
            }
        } catch (error) {
            if (version !== this.sessionVersion) return;
            alert(error instanceof Error ? error.message : "Could not submit the answer");
            // A lost response may already have applied damage. Re-entry must reload
            // server state instead of blindly repeating this submission.
            this.screenSwitcher.switchToScreen({ type: "map" });
        } finally {
            if (version === this.sessionVersion) this.submitting = false;
        }
    }

    // Switches to potion pop up
    handlePotionClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

    }


    // Ends the fight
    endFight(win: boolean): void {
        this.view.endGameText(win);
    }

    handleExplanationClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.explanationPopUp.showLongMultiplicationExplanation(123, 45);
    }

    async startGame(runId: string): Promise<void> {
        const version = ++this.sessionVersion;
        this.submitting = true;
        try {
            await this.loadFight(runId, version);
        } finally {
            if (version === this.sessionVersion) this.submitting = false;
        }
        if (version !== this.sessionVersion) return;

        this.view.resetFight();
        this.view.returnToCombat();

        this.view.updateEnemyHealthBar(this.model.getEnemyHealth(), this.model.getEnemyMaxHealth());
        this.view.setPlayerHealthBar(this.model.getPlayerHealth(), this.model.getPlayerMaxHealth());

        this.view.show();
    }

    getModel(): CombatMainScreenModel {
        return this.model;
    }

    getView(): CombatMainScreenView {
        return this.view;
    }

    // fetch current fight and store it in model
    async loadFight(runId: string, version = this.sessionVersion): Promise<void> {
        const combat = await getCombat(runId);

        if (version !== this.sessionVersion) return;
        this.runId = runId;
        this.model.loadCombat(combat);

        this.view.setQuestion(this.model.getQuestion());
    }
}

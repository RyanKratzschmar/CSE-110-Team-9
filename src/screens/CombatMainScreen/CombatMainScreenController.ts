import type { WrongAnswerPopUpController } from "../../../frontend/src/wrongAnswerExplanationPopUp/controller/WrongAnswerPopUpController.ts";
import type { HintPopUpController } from "../../../frontend/src/hintPopUp/controller/HintPopUpController.ts";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { CombatMainScreenView } from "./CombatMainScreenView.ts";
import { CombatMainScreenModel } from "./CombatMainScreenModel.ts";
import {getCombat } from "../../../frontend/src/api.ts";

export class CombatMainScreenController extends ScreenController {
    private model: CombatMainScreenModel;
    private view: CombatMainScreenView;
    private screenSwitcher: ScreenSwitcher;

    private clickSound: HTMLAudioElement;

    private explanationPopUp: WrongAnswerPopUpController;
    private hintPopUp: HintPopUpController;

    private runId: string | null = null;

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
            () => this.handleSubmitClick(),
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
        if (this.hintPopUp?.isOpen()) {
            this.hintPopUp.close();
        }
        if (this.explanationPopUp?.isOpen()) {
            this.explanationPopUp.close();
        }
        super.hide();
    }

    // Closes equation screen
    handleSubmitClick(): void {

        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.view.returnToCombat();

        const currentHealth = this.model.getEnemyHealth();

        const newHealth = Math.max(0, currentHealth - 10);

        // Update the model
        this.model.setEnemyCurrentHealth(newHealth);

        // Update the view after 1 second delay
            setTimeout(() => {
                this.view.updateEnemyHealthBar(newHealth, this.model.getEnemyMaxHealth());

                if(this.model.getEnemyHealth() <= 0){
                    this.endFight(true);

                    setTimeout(() => {
                        this.screenSwitcher.switchToScreen({ type: "map" });
                    }, 3000);
                }
            }, 500);
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
        await this.loadFight(runId);

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
    // will probably just merge this logic into startGame()
    async loadFight(runId: string): Promise<void> {
        const combat = await getCombat(runId);

        this.runId = runId;
        this.model.loadCombat(combat);

        this.view.setQuestion(this.model.getQuestion());
    }
}

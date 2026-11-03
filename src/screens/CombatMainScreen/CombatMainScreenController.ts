import type { WrongAnswerPopUpController } from "../../../frontend/src/wrongAnswerExplanationPopUp/controller/WrongAnswerPopUpController.ts";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { CombatMainScreenView } from "./CombatMainScreenView.ts";
import { CombatMainScreenModel } from "./CombatMainScreenModel.ts"

export class CombatMainScreenController extends ScreenController {
    private model: CombatMainScreenModel;
    private view: CombatMainScreenView;
    private screenSwitcher: ScreenSwitcher;
    
    private clickSound: HTMLAudioElement;

    private explanationPopUp: WrongAnswerPopUpController;

    constructor(screenSwitcher: ScreenSwitcher, explanationPopUp: WrongAnswerPopUpController) {
        super();
        this.screenSwitcher = screenSwitcher;
        this.explanationPopUp = explanationPopUp;

        this.model = new CombatMainScreenModel();
        this.view = new CombatMainScreenView(
            () => this.handleHintClick(),
            () => this.handleHintXClick(),
            () => this.handleAttackClick(),
            () => this.handleExplanationClick()
        );

        this.clickSound = new Audio("/click.mp3");

    }

    handleAttackClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        //this.view.solveEquation();

        /* Test Code */
        const currentHealth = this.model.getEnemyHealth();

        const newHealth = Math.max(0, currentHealth - 10);

        // Update the model
        this.model.setEnemyCurrentHealth(newHealth);

        // Update the view
        this.view.updateEnemyHealthBar(newHealth, this.model.getEnemyMaxHealth());

        if(this.model.getEnemyHealth() <= 0){
            this.endFight(true);

            setTimeout(() => {
                this.screenSwitcher.switchToScreen({ type: "map" });
            }, 3000);
        }

    }

    // Creates hint pop up
    handleHintClick(): void{
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.view.showHint();

    }

    // Hides hint pop up
    handleHintXClick(): void{
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.view.hideHint();
    }

    endFight(win: boolean): void {
        this.view.endGameText(win);
    }

    handleExplanationClick(): void{
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.explanationPopUp.showLongMultiplicationExplanation(123, 45);
    }

    startGame(): void {
        this.view.show()
        this.model.resetEnemy();
        this.view.updateEnemyHealthBar(this.model.getEnemyHealth(), this.model.getEnemyMaxHealth());
        this.view.resetFight();
    }

    getView(): CombatMainScreenView {
		return this.view;
	}
}
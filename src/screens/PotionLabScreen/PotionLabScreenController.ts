// PotionLabScreenController: picks the difficulty, checks the answer, and puts the brewed potion in the inventory. (Sally)
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { PotionLabScreenView } from "./PotionLabScreenView.ts";
import { PotionLabScreenModel } from "./PotionLabScreenModel.ts"
import { CombatMainScreenModel } from "../CombatMainScreen/CombatMainScreenModel.ts";

export class PotionLabScreenController extends ScreenController {
    private screenSwitcher: ScreenSwitcher;
    private model: PotionLabScreenModel;
    private view: PotionLabScreenView;
    private combatModel: CombatMainScreenModel;

    private clickSound: HTMLAudioElement;

    constructor(screenSwitcher: ScreenSwitcher, combatModel: CombatMainScreenModel){
        super();
        this.screenSwitcher = screenSwitcher;
        this.model = new PotionLabScreenModel();

        this.combatModel = combatModel;

        this.view = new PotionLabScreenView(
            () => this.handleLeaveClick(),
            () => this.handleBasicClick(),
            () => this.handleAdvancedClick(),
            () => this.handleSubmitClick(),
            () => this.handleContinueClick(),
        );

        this.clickSound = new Audio("/click.mp3");

    }

    // Switches back to level map screen when leave is clicked
    handleLeaveClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.screenSwitcher.switchToScreen({ type : "map" });
    }

    handleBasicClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.model.setDifficulty(1);

        this.view.startBasicRecipe();
    }

    handleAdvancedClick() : void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.model.setDifficulty(2);

        this.view.startAdvancedRecipe();
    }

    handleSubmitClick() : void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.model.incrementStep();

        this.view.hideSubmitOverlay();

        setTimeout(() => {
            this.view.showPotion();
        }, 500);

        setTimeout(() => {
            if(this.model.getDifficulty() == 2){
                if(this.model.getStepIndex() != 6){
                    this.view.hidePotion(this.model.getStepIndex());
                } else {
                    this.view.winScreen();
                }
            } else {
                if(this.model.getStepIndex() != 4){
                    this.view.hidePotion(this.model.getStepIndex());
                } else {
                    this.view.winScreen();
                }
            }
        }, 3000);

    }

    handleContinueClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.screenSwitcher.switchToScreen({ type : "map" });
    }

    startPotionLabScreen(): void {
        this.view.setPlayerHealthBar(this.combatModel.getPlayerHealth(), this.combatModel.getPlayerMaxHealth());

        this.model.setDifficulty(0);
        this.model.resetStep();

        this.view.show();
    }

    getView(): PotionLabScreenView {
        return this.view;
    }
}

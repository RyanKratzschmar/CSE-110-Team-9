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

        this.view.startBasicRecipe();
    }

    handleAdvancedClick() : void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.view.startAdvancedRecipe();
    }

    startPotionLabScreen(): void {
        this.view.setPlayerHealthBar(this.combatModel.getPlayerHealth(), this.combatModel.getPlayerMaxHealth());
        this.view.show();
    }

    getView(): PotionLabScreenView {
        return this.view;
    }
}

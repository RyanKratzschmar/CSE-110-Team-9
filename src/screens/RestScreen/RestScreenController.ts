// PotionLabScreenController: picks the difficulty, checks the answer, and puts the brewed potion in the inventory. (Sally)
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { RestScreenView } from "./RestScreenView.ts";
import { CombatMainScreenModel } from "../CombatMainScreen/CombatMainScreenModel.ts";

export class RestScreenController extends ScreenController {
    private screenSwitcher: ScreenSwitcher;
    private view: RestScreenView;
    private combatModel: CombatMainScreenModel;

    private clickSound: HTMLAudioElement;

    constructor(screenSwitcher: ScreenSwitcher, combatModel: CombatMainScreenModel){
        super();
        this.screenSwitcher = screenSwitcher;
        this.combatModel = combatModel;

        this.view = new RestScreenView(
            () => this.handleContinueClick(),
            () => this.handlePotionClick(),
            () => this.handleUpgradeClick(),
        );

        this.clickSound = new Audio("/click.mp3");

    }

    // Handles click on continue button
    handleContinueClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.view.minigamePopUp();
    }

    // Handles click on potion button
    handlePotionClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.screenSwitcher.switchToScreen({ type: "potion" });
    }
    
    // Handles click on upgrade button
    handleUpgradeClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.screenSwitcher.switchToScreen({ type: "upgrade" });
    }

    startRestScreen(): void {
        this.view.setPlayerHealthBar(this.combatModel.getPlayerMaxHealth(), this.combatModel.getPlayerMaxHealth());
        this.combatModel.setPlayerHealth(this.combatModel.getPlayerMaxHealth());
        this.view.show()
    }

    getView(): RestScreenView {
        return this.view;
    }
}

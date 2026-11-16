// UpgradeMinigameScreenController: runs the timer, checks answers, and awards the upgrade once per level. (David)
// PotionLabScreenController: picks the difficulty, checks the answer, and puts the brewed potion in the inventory. (Sally)
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { CombatMainScreenModel } from "../CombatMainScreen/CombatMainScreenModel.ts";
import { UpgradeMinigameScreenView } from "./UpgradeMinigameScreenView.ts";
// import { UpgradeMiniGameScreenModel } from "./UpgradeMinigameScreenModel.ts"

export class UpgradeMinigameScreenController extends ScreenController {
    private screenSwitcher: ScreenSwitcher;
    // private model: PotionLabScreenModel;
    private view: UpgradeMinigameScreenView;
    private combatModel: CombatMainScreenModel;

    private clickSound: HTMLAudioElement;

    constructor(screenSwitcher: ScreenSwitcher, combatModel: CombatMainScreenModel){
        super();
        this.screenSwitcher = screenSwitcher;
        // this.model = new UpgradeMiniGameScreenModel();

        this.combatModel = combatModel;

        this.view = new UpgradeMinigameScreenView(

        );

        this.clickSound = new Audio("/click.mp3");

    }

    startUpgradeMinigameScreen(): void {
        this.view.setPlayerHealthBar(this.combatModel.getPlayerHealth(), this.combatModel.getPlayerMaxHealth());
        this.view.show();
    }

    getView(): UpgradeMinigameScreenView {
        return this.view;
    }
}

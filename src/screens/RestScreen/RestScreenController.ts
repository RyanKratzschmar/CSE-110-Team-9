import type { GameSession } from "../../GameSession";
import { RestStop } from "../../../backend/game/RestStop";
import { finishRest } from "../../../backend/game/GameManager";
// PotionLabScreenController: picks the difficulty, checks the answer, and puts the brewed potion in the inventory. (Sally)
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { RestScreenView } from "./RestScreenView.ts";
import { CombatMainScreenModel } from "../CombatMainScreen/CombatMainScreenModel.ts";

export class RestScreenController extends ScreenController {
    private screenSwitcher: ScreenSwitcher;
    private view: RestScreenView;
    private combatModel: CombatMainScreenModel;

    private restStop = new RestStop();
    private clickSound: HTMLAudioElement;

    constructor(screenSwitcher: ScreenSwitcher, combatModel: CombatMainScreenModel, private readonly gameSession: GameSession){
        super();
        this.screenSwitcher = screenSwitcher;
        this.combatModel = combatModel;

        this.view = new RestScreenView(
            () => this.handleContinueClick(),
            () => this.handlePotionClick(),
            () => this.handleUpgradeClick(),
            () => {
                finishRest(this.gameSession.state);
                this.restStop.leave(this.gameSession.state);
                this.screenSwitcher.switchToScreen({ type: "map" });
            },
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
        this.restStop.rest(this.gameSession.state);
        const player = this.gameSession.state.player;
        this.combatModel.setPlayerHealth(player.hp);
        this.combatModel.setPlayerMaxHealth(player.maxHp);
        this.view.setPlayerHealthBar(player.hp, player.maxHp);
        this.view.show()
    }

    getView(): RestScreenView {
        return this.view;
    }
}

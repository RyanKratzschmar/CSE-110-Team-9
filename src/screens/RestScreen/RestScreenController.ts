import type { GameSession } from "../../GameSession";
import { RestStop } from "../../../backend/game/RestStop";
import { RestMenu } from "../../../backend/game/RestMenu";
import type { RestOption } from "../../../backend/game/RestMenu";
// PotionLabScreenController: picks the difficulty, checks the answer, and puts the brewed potion in the inventory. (Sally)

/////////////////////////////////////////////////////////////////////////////////////////////////////
// This file was merged too early by mistake, the entire file should be included in the PR. - Ryan //
/////////////////////////////////////////////////////////////////////////////////////////////////////

import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { RestScreenView } from "./RestScreenView.ts";
import type { CombatMainScreenModel } from "../CombatMainScreen/CombatMainScreenModel.ts";

export class RestScreenController extends ScreenController {
    private screenSwitcher: ScreenSwitcher;
    private view: RestScreenView;
    private combatModel: CombatMainScreenModel;

    // Share the same RestStop between healing and menu actions.
    private readonly restStop = new RestStop();
    private readonly restMenu = new RestMenu(this.restStop);
    private clickSound: HTMLAudioElement;

    constructor(screenSwitcher: ScreenSwitcher, combatModel: CombatMainScreenModel, private readonly gameSession: GameSession){
        super();
        this.screenSwitcher = screenSwitcher;
        this.combatModel = combatModel;

        this.view = new RestScreenView(
            () => this.handleContinueClick(),
            () => this.handlePotionClick(),
            () => this.handleUpgradeClick(),
            () => this.handleMenuSelection("leave"),
        );

        this.clickSound = new Audio("/click.mp3");

    }

    // Handles click on continue button
    handleContinueClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.restMenu.getOptions(this.gameSession.state);
        this.view.minigamePopUp();
    }

    // Handles click on potion button
    handlePotionClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.handleMenuSelection("potion");
    }
    
    // Handles click on upgrade button
    handleUpgradeClick(): void {
        this.clickSound.currentTime = 0;
        this.clickSound.play();

        this.handleMenuSelection("upgrade");
    }

    // Let RestMenu validate the choice and return the next screen.
    private handleMenuSelection(option: RestOption): void {
        const screen = this.restMenu.selectOption(this.gameSession.state, option);
        this.screenSwitcher.switchToScreen({ type: screen });
    }

    startRestScreen(): void {
        const state = this.gameSession.state;
        if (this.restStop.hasEntered(state)) {
            // Back from the potion lab or upgrade minigame: no second heal, show the choices again
            this.view.minigamePopUp();
        } else {
            // First time here this floor: heal, then show the HP Restored panel
            this.restStop.rest(state);
            this.view.hideMinigamePopUp();
        }
        const player = state.player;
        this.combatModel.setPlayerHealth(player.hp);
        this.combatModel.setPlayerMaxHealth(player.maxHp);
        this.view.setPlayerHealthBar(player.hp, player.maxHp);
        this.view.show()
    }

    getView(): RestScreenView {
        return this.view;
    }
}

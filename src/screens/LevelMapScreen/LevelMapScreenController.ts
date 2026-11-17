import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { LevelMapScreenView } from "./LevelMapScreenView.ts";
import { CombatMainScreenModel } from "../CombatMainScreen/CombatMainScreenModel.ts";
import type { GameSession } from "../../GameSession.ts";
import { finishRest } from "../../../backend/game/GameManager.ts";

export class LevelMapScreenController extends ScreenController {
    private screenSwitcher: ScreenSwitcher;
    private view: LevelMapScreenView;
    private combatModel: CombatMainScreenModel;
    private gameSession: GameSession;

    private clickSound: HTMLAudioElement;

    constructor(screenSwitcher: ScreenSwitcher, combatModel: CombatMainScreenModel, gameSession: GameSession){
        super();
        this.screenSwitcher = screenSwitcher;
        this.combatModel = combatModel;
        this.gameSession = gameSession;

        this.view = new LevelMapScreenView(
            () => this.handleGoClick(),
        );

        this.clickSound = new Audio("/click.mp3");

    }

    // Enters the current stop: combat for a fight, the rest screen for the rest stop
    handleGoClick(): void {

        this.clickSound.currentTime = 0;
        this.clickSound.play();

        const state = this.gameSession.state;
        const node = state.level.currentNode();
        if (!node || state.gameOver) return;

        if (node.type === "combat") {
            this.screenSwitcher.switchToScreen({ type: "game" });
            return;
        }

        finishRest(state);
        this.screenSwitcher.switchToScreen({ type: "rest" });
    }

    startMapScreen(): void {
        const { level } = this.gameSession.state;
        this.view.showProgress(level.number, level.currentIndex);
        this.view.setPlayerHealthBar(this.combatModel.getPlayerHealth(), this.combatModel.getPlayerMaxHealth());
        this.view.show();
    }

    getView(): LevelMapScreenView {
        return this.view;
    }
}

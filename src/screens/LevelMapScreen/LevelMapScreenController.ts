import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { LevelMapScreenView } from "./LevelMapScreenView.ts";
import type { GameSession } from "../../GameSession.ts";

export class LevelMapScreenController extends ScreenController {
    private screenSwitcher: ScreenSwitcher;
    private gameSession: GameSession;
    private view: LevelMapScreenView;

    private clickSound: HTMLAudioElement;

    constructor(screenSwitcher: ScreenSwitcher, gameSession: GameSession){
        super();
        this.screenSwitcher = screenSwitcher;
        this.gameSession = gameSession;

        this.view = new LevelMapScreenView(
            () => this.handleGoClick(),
        );

        this.clickSound = new Audio("/click.mp3");

    }

    // GO! enters the current stop from the backend Level:
    // a fight opens combat, the rest stop heals and starts the next floor
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

        this.screenSwitcher.switchToScreen({ type: "rest" });
    }

    // Draws the map from the backend Level: floor number, cleared stops, current stop, and HP
    startMapScreen(): void {
        const { player, level } = this.gameSession.state;
        this.view.showProgress(level.number, level.currentIndex, player.hp, player.maxHp);
        this.view.showMessage("");
        this.view.show();
    }

    getView(): LevelMapScreenView {
        return this.view;
    }
}

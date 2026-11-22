import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import type { GameSession } from "../../GameSession.ts";
import { GameOverScreenView } from "./GameOverScreenView.ts";

export class GameOverScreenController extends ScreenController {
    private readonly view: GameOverScreenView;

    constructor(screenSwitcher: ScreenSwitcher, private readonly gameSession: GameSession) {
        super();
        this.view = new GameOverScreenView(
            () => {
                this.gameSession.newGame();
                screenSwitcher.switchToScreen({ type: "map" });
            },
            () => screenSwitcher.switchToScreen({ type: "menu" }),
        );
    }

    // Ending a run also applies to a player who quits while still alive.
    override show(): void {
        this.gameSession.state.gameOver = true;
        this.gameSession.state.combat = null;
        this.view.show();
    }

    getView(): GameOverScreenView {
        return this.view;
    }
}


import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { TitleScreenView } from "./TitleScreenView.ts";
import type { GameSession } from "../../GameSession.ts";
import Konva from "konva";

export class TitleScreenController extends ScreenController{
	private view: TitleScreenView;
	private screenSwitcher: ScreenSwitcher;
	private gameSession: GameSession;
    private clickSound: HTMLAudioElement;

	constructor(screenSwitcher: ScreenSwitcher, gameSession: GameSession) {
        super()

		this.screenSwitcher = screenSwitcher;
		this.gameSession = gameSession;
		this.view = new TitleScreenView(
			() => this.handleNewGameClick(),
			() => this.handleLeaderBoardClick(),
			() => this.handleContinueClick());

        this.clickSound = new Audio("/click.mp3");
	}



	/**
	 * Handle button clicks
	 */
    private handleNewGameClick(): void {
		this.clickSound.currentTime = 0;
		this.clickSound.play();

		// Fresh player at full HP, floor 1, first fight
		this.gameSession.newGame();
        this.screenSwitcher.switchToScreen({type : "map"});
    }

	private handleContinueClick(): void {
        // TODO: Add the action for starting a new game.
		this.clickSound.currentTime = 0;
		this.clickSound.play();

        this.screenSwitcher.switchToScreen({type : "menu"});
    }

	private handleLeaderBoardClick(): void {
        // TODO: Add the action for starting a new game.
		this.clickSound.currentTime = 0;
		this.clickSound.play();

        this.screenSwitcher.switchToScreen({type : "menu"});
    }

	/**
	 * Show the title screen
	 */
	getView(): TitleScreenView {
		return this.view;
	}

	/**
	 * Hide the title screen
	 */
	hide(): void {
		this.view.hide();
	}

	/**
	 * Get the Konva group for adding it to a layer
	 */
	getGroup(): Konva.Group {
		return this.view.getGroup();
	}
}

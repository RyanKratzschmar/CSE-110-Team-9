import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { TitleScreenController } from "./screens/TitleScreen/TitleScreenController.ts";
import { CombatMainScreenController } from "./screens/CombatMainScreen/CombatMainScreenController.ts";
import { LevelMapScreenController } from "./screens/LevelMapScreen/LevelMapScreenController.ts"; //
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";
import { WrongAnswerPopUpController } from "../frontend/src/wrongAnswerExplanationPopUp/controller/WrongAnswerPopUpController";
import { HintPopUpController } from "../frontend/src/hintPopUp/controller/HintPopUpController.ts";
import { PotionLabScreenController } from "./screens/PotionLabScreen/PotionLabScreenController.ts";
import { RestScreenController } from "./screens/RestScreen/RestScreenController.ts";
import { UpgradeMinigameScreenController } from "./screens/UpgradeMinigameScreen/UpgradeMinigameScreenController.ts"
import { GameSession } from "./GameSession.ts";
import { GameOverScreenController } from "./screens/GameOverScreen/GameOverScreenController.ts";
import { createEndGameButton } from "./EndGameButton.ts";
import { LeaderBoardScreenController } from "./screens/LeaderboardScreen/LeaderboardScreenController.ts";
/**
 * Main Application - Coordinates all screens
 *
 * This class demonstrates screen management using Konva Groups.
 * Each screen (Menu, Game, Results) has its own Konva.Group that can be
 * shown or hidden independently.
 *
 * Key concept: All screens are added to the same layer, but only one is
 * visible at a time. This is managed by the switchToScreen() method.
 */
class App implements ScreenSwitcher {
	private stage: Konva.Stage;
	private layer: Konva.Layer;

	private titleScreenController: TitleScreenController;
	private combatMainScreenController: CombatMainScreenController;
	private levelMapScreenController: LevelMapScreenController;
	private potionLabScreenController: PotionLabScreenController;
	private restScreenController: RestScreenController;
	private upgradeMinigameScreenController: UpgradeMinigameScreenController;
	private leaderBoardScreenController: LeaderBoardScreenController;
	private gameOverScreenController: GameOverScreenController;
	private endGameButton: Konva.Group;

	private readonly gameSession = new GameSession();

	constructor(container: string) {
		// Initialize Konva stage (the main canvas)
		this.stage = new Konva.Stage({
			container,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
		});

		// Create a layer (screens will be added to this layer)
		this.layer = new Konva.Layer();
		this.stage.add(this.layer);
		const explanationPopUp = new WrongAnswerPopUpController(this.stage);
		const hintPopUp = new HintPopUpController(this.stage);

		// Initialize all screen controllers
		// Each controller manages a Model, View, and handles user interactions

		this.titleScreenController = new TitleScreenController(this, this.gameSession);
		this.combatMainScreenController = new CombatMainScreenController(this, explanationPopUp, hintPopUp, this.gameSession);
		this.levelMapScreenController = new LevelMapScreenController(this, this.gameSession); //
		this.potionLabScreenController = new PotionLabScreenController(this, this.gameSession, explanationPopUp);
		this.restScreenController = new RestScreenController(this, this.combatMainScreenController.getModel(), this.gameSession);
		this.upgradeMinigameScreenController = new UpgradeMinigameScreenController(this, this.combatMainScreenController.getModel(), this.gameSession);
		this.leaderBoardScreenController = new LeaderBoardScreenController(this);
		this.gameOverScreenController = new GameOverScreenController(this, this.gameSession);

		window.addEventListener("resize", () => {
			hintPopUp.handleResize();
		});

		// Add all screen groups to the layer
		// All screens exist simultaneously but only one is visible at a time
		this.layer.add(this.titleScreenController.getView().getGroup());
		this.layer.add(this.combatMainScreenController.getView().getGroup());
		this.layer.add(this.levelMapScreenController.getView().getGroup()); //
		this.layer.add(this.potionLabScreenController.getView().getGroup());
		this.layer.add(this.restScreenController.getView().getGroup());
		this.layer.add(this.upgradeMinigameScreenController.getView().getGroup());
		this.layer.add(this.leaderBoardScreenController.getView().getGroup());
		this.layer.add(this.gameOverScreenController.getView().getGroup());

		// Share the same End Game control across screens without duplicating their UI.
		const controlsLayer = new Konva.Layer();
		this.endGameButton = createEndGameButton(() => this.switchToScreen({ type: "gameover" }));
		controlsLayer.add(this.endGameButton);
		this.stage.add(controlsLayer);

		// Draw the layer (render everything to the canvas)
		this.layer.draw();

		// Start with menu screen visible
		this.titleScreenController.getView().show();

		// DEV: add ?potion to the URL to skip straight to the potion lab (for testing)
		if (new URLSearchParams(window.location.search).has("potion")) {
			const level = this.gameSession.state.level;
			while (level.currentNode()?.type !== "rest") level.completeCurrent();
			this.switchToScreen({ type: "potion" });
		}
	}

	/**
	 * Switch to a different screen
	 *
	 * This method implements screen management by:
	 * 1. Hiding all screens (setting their Groups to invisible)
	 * 2. Showing only the requested screen
	 *
	 * This pattern ensures only one screen is visible at a time.
	 */

    
	switchToScreen(screen: Screen): void {
        const player = this.gameSession.state.player;
        this.combatMainScreenController.getModel().setPlayerHealth(player.hp);
        this.combatMainScreenController.getModel().setPlayerMaxHealth(player.maxHp);
		// Hide all screens first by setting their Groups to invisible
		this.titleScreenController.hide();
		this.combatMainScreenController.hide(); // TODO
		this.levelMapScreenController.hide();
		this.potionLabScreenController.hide();
		this.restScreenController.hide();
		this.upgradeMinigameScreenController.hide();
		this.leaderBoardScreenController.hide();
		this.gameOverScreenController.hide();

		// Show the requested screen based on the screen type
		switch (screen.type) {
			case "gameover":
				this.gameOverScreenController.show();
				break;

			case "menu":
				this.titleScreenController.show();
				break;

			case "game":
				// Start the game (which also shows the game screen)
				this.combatMainScreenController.startGame();
				break;

			case "map":
				// Show results with the final score
				this.levelMapScreenController.startMapScreen();
				break;

			case "potion":
				this.potionLabScreenController.startPotionLabScreen();
				break;

			case "rest":
				this.restScreenController.startRestScreen();
				break;

			case "upgrade":
				this.upgradeMinigameScreenController.startUpgradeMinigame();
				break;

			case "leaderboard":
				//Show leaderboard
				this.leaderBoardScreenController.startLeaderboard();
				break;
		}
		this.endGameButton.visible(screen.type !== "menu");
		this.endGameButton.getLayer()?.batchDraw();
	}
}

// Initialize the application
export const app = new App("container");

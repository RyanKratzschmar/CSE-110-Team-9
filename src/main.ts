import Konva from "konva";
import type { ScreenSwitcher, Screen } from "./types.ts";
import { TitleScreenController } from "./screens/TitleScreen/TitleScreenController.ts";
import { CombatMainScreenController } from "./screens/CombatMainScreen/CombatMainScreenController.ts";
//import { ResultsScreenController } from "./screens/ResultsScreen/ResultsScreenController.ts"; //
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";

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
	//private resultsController: ResultsScreenController;

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

		// Initialize all screen controllers
		// Each controller manages a Model, View, and handles user interactions

		this.titleScreenController = new TitleScreenController(this);
		this.combatMainScreenController = new CombatMainScreenController(this);
		//this.resultsController = new ResultsScreenController(this); //

		// Add all screen groups to the layer
		// All screens exist simultaneously but only one is visible at a time
		this.layer.add(this.titleScreenController.getView().getGroup());
		this.layer.add(this.combatMainScreenController.getView().getGroup());
		//this.layer.add(this.resultsController.getView().getGroup()); //

		// Draw the layer (render everything to the canvas)
		this.layer.draw();

		// Start with menu screen visible
		this.titleScreenController.getView().show();
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
		// Hide all screens first by setting their Groups to invisible
		this.titleScreenController.hide();
		this.combatMainScreenController.hide(); // TODO
		//this.resultsController.hide();

		// Show the requested screen based on the screen type
		switch (screen.type) {
			case "menu":
				this.titleScreenController.show();
				break;

			case "game":
				// Start the game (which also shows the game screen)
				this.combatMainScreenController.startGame();
				break;

			/*case "result":
				// Show results with the final score
				this.resultsController.showResults(screen.score);
				break;*/
		}
	}
}

// Initialize the application
new App("container");

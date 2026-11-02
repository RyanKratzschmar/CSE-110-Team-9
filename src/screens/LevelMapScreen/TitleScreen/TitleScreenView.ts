import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";

export class TitleScreenView implements View {
	private group: Konva.Group;

	constructor(
		onNewGameClick : () => void,
		onLeaderBoardClick : () => void,
		onContinueClick : () => void,
	) {
		this.group = new Konva.Group({ visible: false });

		// Purple background
		const bg = new Konva.Rect({
			x: 0,
			y: 0,
			width: STAGE_WIDTH,
			height: STAGE_HEIGHT,
			fill: "#433550",
		});
		this.group.add(bg);

		// Create Title Text at the Top of the Screen
		const titleText = new Konva.Text({
			x: 0,
			y: 20,
			width: STAGE_WIDTH,
			text: "Game Title",
			fontSize: 100,
			fontFamily: "Arial",
			fontStyle: "bold",
			fill: "#4E77BC",
			align: "center",
		});
		this.group.add(titleText);

        const buttonX = STAGE_WIDTH / 2;
        const buttonY = STAGE_HEIGHT - 200;
        const buttonWidth = 240;
        const buttonHeight = 80;


        const newGameButton = new Konva.RegularPolygon({
            x: buttonX,
            y: buttonY,
            sides: 6,
            radius: 90,
            scaleX: buttonWidth / 100,
            scaleY: buttonHeight /75,
            fill: "#FFC943",
            Stroke: "white",
            strokeWidth: 3,
        });

		newGameButton.on("click tap", () => {
			onNewGameClick();
		});

		newGameButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
			newGameButton.fill("#B678D0");
			newGameButton.getLayer()?.draw();
		});

		newGameButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
			newGameButton.fill("#FFC943");
			newGameButton.getLayer()?.draw();
		});

        this.group.add(newGameButton);

        const newGameText = new Konva.Text({
			x: buttonX - buttonWidth / 2,
			y: buttonY - 19,
			width: buttonWidth,
			text: "New Game",
			fontSize: 40,
			fontFamily: "Arial",
			fontStyle: "bold",
			fill: "black",
			align: "center",
			listening: false,
		});
        this.group.add(newGameText);


        const continueGameButton = new Konva.RegularPolygon({
            x: buttonX + 500,
            y: buttonY - 50,
            sides: 6,
            radius: 90,
            scaleX: buttonWidth / 100,
            scaleY: buttonHeight /75,
            fill: "#FFC943",
            Stroke: "white",
            strokeWidth: 3,
        });
        //TODO Add Functionality
        continueGameButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
			continueGameButton.fill("#B678D0");
			continueGameButton.getLayer()?.draw();
		});

		continueGameButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
			continueGameButton.fill("#FFC943");
			continueGameButton.getLayer()?.draw();
		});

        this.group.add(continueGameButton);

		continueGameButton.on("click tap", () => {
			onContinueClick();
        });

        const continueGameText = new Konva.Text({
			x: buttonX + 380,
			y: buttonY - 69,
			width: buttonWidth,
			text: "Continue",
			fontSize: 40,
			fontFamily: "Arial",
			fontStyle: "bold",
			fill: "black",
			align: "center",
			listening: false,
		});
        this.group.add(continueGameText);


        const leaderboardButton = new Konva.RegularPolygon({
            x: buttonX - 500,
            y: buttonY - 50,
            sides: 6,
            radius: 90,
            scaleX: buttonWidth / 100,
            scaleY: buttonHeight /75,
            fill: "#FFC943",
            Stroke: "white",
            strokeWidth: 3,
        });
        //TODO Add Functionality
        leaderboardButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
			leaderboardButton.fill("#B678D0");
			leaderboardButton.getLayer()?.draw();
		});

		leaderboardButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
			leaderboardButton.fill("#FFC943");
			leaderboardButton.getLayer()?.draw();
		});
        
        this.group.add(leaderboardButton);

		leaderboardButton.on("click tap", () => {
			onLeaderBoardClick();
        });

        const leaderboardText = new Konva.Text({
			x: buttonX - 625,
			y: buttonY - 69,
			width: buttonWidth + 5,
			text: "Leaderboard",
			fontSize: 40,
			fontFamily: "Arial",
			fontStyle: "bold",
			fill: "black",
			align: "center",
			listening: false,
		});
        this.group.add(leaderboardText);
	}

	show(): void {
		this.group.visible(true);
		this.group.getLayer()?.draw();
	}

	hide(): void {
		this.group.visible(false);
		this.group.getLayer()?.draw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}
}
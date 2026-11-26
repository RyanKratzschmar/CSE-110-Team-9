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

		const logoImage = new Image();

		logoImage.src = "/logo.png";

		const logo = new Konva.Image({
			image: logoImage,
			width: 800,
			height: 800,
			x: 400,
			y: -100,
			visible: true,
		});

		this.group.add(logo);

        const buttonX = STAGE_WIDTH / 2;
        const buttonY = STAGE_HEIGHT - 200;
        const buttonWidth = 240;
        const buttonHeight = 80;

		const newGame = new Image();

		newGame.src = "/New Game.png"

        const newGameButton = new Konva.Image({
			image: newGame,
			name: "new_game_button",
            x: 566,
            y: 500,
        });

		newGameButton.on("click tap", () => {
			onNewGameClick();
		});

		newGameButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		newGameButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.group.add(newGameButton);


		/*
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

		*/

		const leaderboard = new Image();

		leaderboard.src = "/Leaderboard.png";

        const leaderboardButton = new Konva.Image({
			image: leaderboard,
            x: 566,
            y: 650,
			width: 234 * 2,
			height: 47 * 2,
        });
        //TODO Add Functionality
        leaderboardButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
			leaderboardButton.getLayer()?.draw();
		});

		leaderboardButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
			leaderboardButton.getLayer()?.draw();
		});
        
        this.group.add(leaderboardButton);

		leaderboardButton.on("click tap", () => {
			onLeaderBoardClick();
        });

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
import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";

export class CombatMainScreenView implements View {
    private group: Konva.Group;
    private dimOverlay: Konva.Rect;
    private hintPopUp: Konva.Rect;
    private hintXButton: Konva.Rect;
    private hintXText: Konva.Text;

    constructor(
        onHintClick : () => void,
        onHintXClick : () => void,
    ) {
        this.group = new Konva.Group({ visible: false });

        // Create Background Look
        const bg = new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#433550",
        });
        this.group.add(bg);

        // Background Element
        const upperRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: 150,
            fill: "#180221",
            stroke: "#410559",
        });
        this.group.add(upperRect);

        //Background Element
        const lowerRect = new Konva.Rect({
            x: 0,
            y: 750,
            width: STAGE_WIDTH,
            height: 150,
            fill: "#3D1B48",
            stroke: "#4b2d59",
        });
        this.group.add(lowerRect);

        //Background for health bar when health is missing
        const healthBarBG = new Konva.Rect({
            x: 100,
            y: 35,
            width: 400,
            height: 70,
            fill: "#c4c4c4ff",
            stroke: "#42a847",      
        });  
        this.group.add(healthBarBG);

        //Player Health Bar
        const healthBar = new Konva.Rect({
            x: 100,
            y: 35,
            width: 300,
            height: 70,
            fill: "#0bba14",
            stroke: "#42a847",        
        });  
        this.group.add(healthBar);

        //Text that says "HP" next to the player's health
        const hpText = new Konva.Text({
            x: 25,
            y: 50,
            text: "HP",
			fontSize: 40,
			fontFamily: "Arial",
			fontStyle: "bold",
            fill: "#0bba14",
        })
        this.group.add(hpText);

        // Button For Settings
        const settingsButton = new Konva.Circle({
            x: STAGE_WIDTH - 100,
            y: 75,
            radius: 60,
            fill: "#94948e",
        });
        this.group.add(settingsButton);

        const settingsText = new Konva.Text({
            x: STAGE_WIDTH - 160,
            y: 60,
            text: "Settings",
            fontFamily: "Arial",
			fontSize: 30,
            fontStyle: "bold",
            fill: "black",
        });
        this.group.add(settingsText);

        // Button to go view potions
        const potionButton = new Konva.Rect({
            y: 200,
            x: 100,
            width: 150,
            height: 100,
            cornerRadius: 10,
            fill: "#219bd9",
            stroke: "#1884ba",
        });
        this.group.add(potionButton);

        //Text that says "Potion"
        const potionButtonText = new Konva.Text({
            text: "Potion",
            y: 232.5,
            x: 130,
            width: 150,
            fontFamily: "Arial",
			fontSize: 30,
            fill: "#ffff",
        })
        this.group.add(potionButtonText);


        // Button to attack
        const attackButton = new Konva.Rect({
            y: 200,
            x: 400,
            width: 150,
            height: 100,
            cornerRadius: 10,
            fill: "#219bd9",
            stroke: "#1884ba",
        });
        this.group.add(attackButton);

        //Text that says "Attack"
        const attackButtonText = new Konva.Text({
            text: "Attack",
            y: 232.5,
            x: 432.5,
            width: 150,
            fontFamily: "Arial",
			fontSize: 30,
            fill: "#ffff",
        });
        this.group.add(attackButtonText);

        // The player Character
        const player = new Konva.Rect({
            width: 300,
            height: 350,
            x: 175,
            y:350,
            fill: "#ffff"
        });
        this.group.add(player);





        // The enemy character
        const enemy = new Konva.Rect({
            width: 300,
            height: 350,
            x: STAGE_WIDTH - 475,
            y: 350,
            fill: "#ffff"
        });
        this.group.add(enemy);

        //Background for when enemy health is missing
        const enemyHealthBarBG = new Konva.Rect({
            width: 350,
            height: 60,
            x: STAGE_WIDTH - 500,
            y: 250,
            fill: "#c4c4c4ff",
            Stroke: "#940d03",
        });
        this.group.add(enemyHealthBarBG);

        // enemy health bar
        const enemyHealthBar = new Konva.Rect({
            width: 300,
            height: 60,
            x: STAGE_WIDTH - 500,
            y: 250,
            fill: "#F24822",
            Stroke: "#940d03",
        });
        this.group.add(enemyHealthBar);

        // Score Text
        const scoreText = new Konva.Text({
            x: 600,
            y: 50,
            fontSize: 40,
            text: "Score",
            fill: "#FF9E42",
            fontFamily: "arial",
        });
        this.group.add(scoreText);

        // Shape next to score
        const scoreBug = new Konva.Rect({
            x: 570,
            y: 52,
            width: 25,
            height: 25,
            cornerRadius: 5,
            rotation: 45,
            fill: "#FF9E42",
            stroke: "#cc721d",
        });
        this.group.add(scoreBug);

        // Create Hint Button
        const hintButton = new Konva.Rect({
            x: 1300,
            y: 787.5,
            width: 200,
            height: 75,
            fill: "#FF9E42",
            stroke: "#cc721d",
            cornerRadius: 10,
        })
        this.group.add(hintButton);

        // Handle Hint Click
        hintButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		hintButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        hintButton.on("click tap", () => {
			onHintClick();
        });

        // Text that says "get hint"
        const hintText = new Konva.Text({
            x: 1320,
            y: 802.5,
            fontSize: 40,
            text: "Get Hint",
            fill: "#000000",
            fontFamily: "arial",
            fontStyle: "bold",
            listening: false,
        });
        this.group.add(hintText);

        // Create Dim Overlay
        this.dimOverlay = new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "black",
            opacity: 0.6,
            visible: false,
        });
        this.group.add(this.dimOverlay);
        
        // Create Hint Pop up
        this.hintPopUp = new Konva.Rect({
            x: 100,
            y:100,
            width: STAGE_WIDTH - 200,
            height: STAGE_HEIGHT - 200,
            fill: "white",
            visible: false,
        });
        this.group.add(this.hintPopUp);

        // Create X button for hint popup
        this.hintXButton = new Konva.Rect({
            x: 1425,
            y: 125,
            width: 40,
            height: 40,
            cornerRadius: 10,
            fill: "#FF9E42",
            stroke: "#cc721d",
            visible: false,
        });
        this.group.add(this.hintXButton);

        // Text for X button
        this.hintXText = new Konva.Text({
            fill: "black",
            text: "X",
            fontFamily: "arial",
            fontSize: 40,
            fontStyle: "bold",
            x: 1432,
            y: 125,
            visible: false,
            listening: false,
        });
        this.group.add(this.hintXText);

        this.hintXButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.hintXButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.hintXButton.on("click tap", () => {
			onHintXClick();
        });
    }

    showHint(): void {
        this.dimOverlay.visible(true);
        this.hintPopUp.visible(true);
        this.hintXButton.visible(true);
        this.hintXText.visible(true);
        this.group.getLayer()?.batchDraw();    
    }

    hideHint(): void {
        this.dimOverlay.visible(false);
        this.hintPopUp.visible(false);
        this.hintXButton.visible(false);
        this.hintXText.visible(false);
        this.group.getLayer()?.batchDraw();    
    }

    /**
	 * Show the screen
	 */
	show(): void {
		this.group.visible(true);
		this.group.getLayer()?.draw();
	}

	/**
	 * Hide the screen
	 */
	hide(): void {
		this.group.visible(false);
		this.group.getLayer()?.draw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}
}
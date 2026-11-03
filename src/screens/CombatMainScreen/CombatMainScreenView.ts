import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";

export class CombatMainScreenView implements View {
    private group: Konva.Group;

    private dimOverlay: Konva.Rect;
    private hintPopUp: Konva.Rect;
    private hintXButton: Konva.Rect;
    private hintXText: Konva.Text;
    private enemyHealthBar: Konva.Rect;
    private victoryText: Konva.Text;
    private defeatText: Konva.Text;
    private attackButton: Konva.Rect;
    private attackButtonText: Konva.Text;
    private potionButton: Konva.Rect;
    private potionButtonText: Konva.Text;
    private enemy: Konva.Rect;
    private player: Konva.Rect;
    private enemyHealthBarBG: Konva.Rect;
    private equationOverlay: Konva.Rect;

    constructor(
        onHintClick : () => void,
        onHintXClick : () => void,
        onAttackClick : () => void,
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
        this.potionButton = new Konva.Rect({
            y: 200,
            x: 100,
            width: 150,
            height: 100,
            cornerRadius: 10,
            fill: "#219bd9",
            stroke: "#1884ba",
        });
        this.group.add(this.potionButton);

        //Text that says "Potion"
        this.potionButtonText = new Konva.Text({
            text: "Potion",
            y: 232.5,
            x: 130,
            width: 150,
            fontFamily: "Arial",
			fontSize: 30,
            fill: "#ffff",
        })
        this.group.add(this.potionButtonText);


        // Button to attack
        this.attackButton = new Konva.Rect({
            y: 200,
            x: 400,
            width: 150,
            height: 100,
            cornerRadius: 10,
            fill: "#219bd9",
            stroke: "#1884ba",
            visible: true,
        });
        this.group.add(this.attackButton);

        //Text that says "Attack"
        this.attackButtonText = new Konva.Text({
            text: "Attack",
            y: 232.5,
            x: 432.5,
            width: 150,
            fontFamily: "Arial",
			fontSize: 30,
            fill: "#ffff",
            listening: false,
            visible: true,
        });
        this.group.add(this.attackButtonText);

        this.attackButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.attackButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.attackButton.on("click tap", () => {
			onAttackClick();
        });

        // The player Character
        this.player = new Konva.Rect({
            width: 300,
            height: 350,
            x: 175,
            y:350,
            fill: "#ffff"
        });
        this.group.add(this.player);





        // The enemy character
        this.enemy = new Konva.Rect({
            width: 300,
            height: 350,
            x: STAGE_WIDTH - 475,
            y: 350,
            fill: "#ffff"
        });
        this.group.add(this.enemy);

        //Background for when enemy health is missing
        this.enemyHealthBarBG = new Konva.Rect({
            width: 350,
            height: 60,
            x: STAGE_WIDTH - 500,
            y: 250,
            fill: "#c4c4c4ff",
            Stroke: "#940d03",
        });
        this.group.add(this.enemyHealthBarBG);

        // enemy health bar
        this.enemyHealthBar = new Konva.Rect({
            width: 350,
            height: 60,
            x: STAGE_WIDTH - 500,
            y: 250,
            fill: "#F24822",
            Stroke: "#940d03",
        });
        this.group.add(this.enemyHealthBar);

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

        // Adds Victory Text
        this.victoryText = new Konva.Text({
            fill: "green",
            fontSize: 80,
            fontStyle: "bold",
            fontFamily: "arial",
            text: "Victory!",
            x: 625,
            y: 200,
            visible: false,
        });
        this.group.add(this.victoryText);

        this.defeatText = new Konva.Text({
            fill: "red",
            fontSize: 80,
            fontStyle: "bold",
            fontFamily: "arial",
            text: "Defeat",
            x: 800,
            y: 200,
            visible: false,
        });
        this.group.add(this.defeatText);


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

        // Create overlay when equation is being solved
        this.equationOverlay = new Konva.Rect({
            x: 0,
            y: 150,
            width: STAGE_WIDTH,
            height: 600,
            fill: "#433550",
            visible: false,
        });
        this.group.add(this.equationOverlay);
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

    // Updates enemy health
    updateEnemyHealthBar(currentHealth: number, maxHealth: number): void {
        if (maxHealth <= 0) {
            this.enemyHealthBar.width(0);
            this.group.getLayer()?.batchDraw();
            return;
        }

        const percentage = Math.max(0, Math.min(currentHealth / maxHealth, 1));

        this.enemyHealthBar.width(350 * percentage);

        this.group.getLayer()?.batchDraw();
    }

    // Resets victory or defeat text, and shows attack and potion buttons
    resetFight(): void {
        this.victoryText.visible(false);
        this.defeatText.visible(false);

        this.potionButton.visible(true);
        this.attackButton.visible(true);

        this.potionButtonText.visible(true);
        this.attackButtonText.visible(true);
    }

    // Changes display to account for player winning or losing
    endGameText(win: boolean): void {
        if(win){
            this.victoryText.visible(true);
        } else {
            this.defeatText.visible(true);
        }
        this.attackButton.visible(false);
        this.attackButtonText.visible(false);
        this.potionButton.visible(false);
        this.potionButtonText.visible(false);

        this.group.getLayer()?.batchDraw();
    }

    // Pop Up Equation Solving
    solveEquation(): void{
        this.equationOverlay.visible(true);
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
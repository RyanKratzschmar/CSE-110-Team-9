// PotionLabScreenView: difficulty choice, the PEMDAS equation, answer field, and the potion-brewed message. (Sally, Oliver; UI: Ryan)


/////////////////////////////////////////////////////////////////////////////////////////////////////
// This file was merged too early by mistake, the entire file should be included in the PR. - Ryan //
/////////////////////////////////////////////////////////////////////////////////////////////////////

import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";
import {
    createHealthPercentage,
    updatePlayerHealthBar
} from "../../PlayerHealthBar.ts";

export class RestScreenView implements View {
    private group: Konva.Group;

    // Add all shapes taht need to be updated
    private restRect: Konva.Rect;
    private restText: Konva.Text;
    private purpleRect: Konva.Rect;
    private whiteRect: Konva.Rect;
    private hpRestoredText: Konva.Text;

    private healthBar: Konva.Rect;
    private healthPercentage: Konva.Text;
    private hpRect: Konva.Rect;
    private newHealthBar: Konva.Rect;
    private newHPText: Konva.Text;

    private continueButton: Konva.Rect;
    private continueButtonText: Konva.Text;
    private popUpOverlay: Konva.Rect;
    private potionButton: Konva.Circle;
    private upgradeButton: Konva.Circle;
    private potionButtonText: Konva.Text;
    private upgradeButtonText: Konva.Text;
    private floorText: Konva.Text;

    constructor(
        onContinueClick: () => void,
        onPotionClick: () => void,
        onUpgradeClick: () => void,
        onLeaveRest: () => void,
    ){

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

        const upperRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: 150,
            fill: "#180221",
            stroke: "#410559",
        });
        this.group.add(upperRect);

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
        this.healthBar = new Konva.Rect({
            x: 100,
            y: 35,
            width: 400,
            height: 70,
            fill: "#0bba14",
            stroke: "#42a847",
        });
        this.group.add(this.healthBar);

        // Display the player's HP percentage.
        this.healthPercentage = createHealthPercentage(
            this.healthBar, 400
        );
        this.group.add(this.healthPercentage);



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

        // Score Text
        /*
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
        */

        this.floorText = new Konva.Text({
            x: 1200,
            y: 50,
            text: "Floor: X",
            fill: "white",
            fontSize: 40,
            fontFamily: "arial",
            fontStyle: "bold",
        });
        this.group.add(this.floorText);

        // add rectangle containing take a rest text
        this.restRect = new Konva.Rect({
            height: 125,
            width: 600,
            x: 500,
            y: 200,
            cornerRadius: 5,
            fill: "#401992",
            stroke: "#1b034e",
        });
        this.group.add(this.restRect);

        // add "take a rest" text
        this.restText = new Konva.Text({
            text: "Take a Rest",
            fill: "white",
            x: 670,
            y: 235,
            fontFamily: "arial",
            fontSize: 50,
            fontStyle: "bold",
        });
        this.group.add(this.restText);

        // add outer purple rectangle
        this.purpleRect = new Konva.Rect({
            width: 600,
            height: 550,
            x: 500,
            y: 325,
            fill: "#4F2E72",
            stroke: "#1b034e",
            cornerRadius: 5,
        });
        this.group.add(this.purpleRect);

        // add inner white rectangle
        this.whiteRect = new Konva.Rect({
            width: 450,
            height: 450,
            x: 575,
            y: 375,
            fill: "#e8e6e9",
            stroke: "#b3b1b4",
            cornerRadius: 5,
        });
        this.group.add(this.whiteRect);

        // add text that says "HP Restored"
        this.hpRestoredText = new Konva.Text({
            text: "HP Restored!",
            fill: "black",
            fontSize: 50,
            fontFamily: "arial",
            x: 650,
            y: 400,
            fontStyle: "bold",
        });
        this.group.add(this.hpRestoredText);

        // add rect that contains full health bar
        this.hpRect = new Konva.Rect({
            fill: "#4F2E72",
            stroke: "red",
            width: 350,
            height: 50,
            x: 625,
            y: 480,
            cornerRadius: 5,
        });
        this.group.add(this.hpRect);

        // add new health bar
        this.newHealthBar = new Konva.Rect({
            fill: "#0bba14",
            stroke: "#42a847",
            width: 200,
            height: 30,
            x: 675,
            y: 490,
            cornerRadius: 20,
        });
        this.group.add(this.newHealthBar);

        // adds new HP text
        this.newHPText = new Konva.Text({
            fill: "white",
            text: "HP                              100/100",
            fontSize: 25,
            fontFamily: "arial",
            x: 635,
            y: 492.5,
        });
        this.group.add(this.newHPText);

        // adds new HP text
        this.newHPText = new Konva.Text({
            fill: "white",
            text: "HP",
            fontSize: 25,
            fontFamily: "arial",
            x: 635,
            y: 492.5,
        });
        this.group.add(this.newHPText);

        // Add continue Button
        this.continueButton = new Konva.Rect({
            fill: "#FF9E42",
            stroke: "#cc721d", 
            width: 200,
            height: 50,
            x: 700,
            y: 750,
            cornerRadius: 5,
        });
        this.group.add(this.continueButton);

        // Handle Continue Button Click
        this.continueButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.continueButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.continueButton.on("click tap", () => {
			onContinueClick();
        });


        // Adds continue button text
        this.continueButtonText = new Konva.Text({
            text: "Continue",
            fill: "white",
            x: 735,
            y: 760,
            fontSize: 30,
            listening: false,
        });
        this.group.add(this.continueButtonText);

        // adds innermost purple rectangle
        const innerMostRect = new Konva.Rect({
            fill: "#4F2E72",
            stroke: "#1b034e",
            width: 300,
            height: 150,
            x: 650,
            y: 565,
            cornerRadius: 5,
        });
        this.group.add(innerMostRect);
        
        // adds text that says "hp has been restored to full"
        const hpRestoredToFullText = new Konva.Text({
            text: "Your health has been restored to full!",
            fill: "white",
            x: 700,
            y: 600,
            fontFamily: "arial",
            fontSize: 25,
            width: 200,
            align: "center",
            fontStyle: "bold",
            lineHeight: 1.2,
        });
        this.group.add(hpRestoredToFullText);

        // Create overlay when continue is clicked
        this.popUpOverlay = new Konva.Rect({
            x: 0,
            y: 150,
            width: STAGE_WIDTH,
            height: 800,
            fill: "#433550",
            visible: false,
        });
        this.group.add(this.popUpOverlay);

        // Button that takes player to potion lab
        this.potionButton = new Konva.Circle({
            radius: 200,
            fill: "#401992",
            stroke: "#1b034e",
            x: 1150,
            y: 500,
            visible: false,
        });
        this.group.add(this.potionButton);

        // Adds text for potion button
        this.potionButtonText = new Konva.Text({
            text: "Go to the Potion Lab",
            fill: "white",
            x: 975,
            y: 450,
            fontFamily: "arial",
            fontSize: 40,
            fontStyle: "bold",
            width: 350,
            align: "center",
            lineHeight: 1.3,
            visible: false,
            listening: false,
        });
        this.group.add(this.potionButtonText);

        // Handle potion lab Button Click
        this.potionButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.potionButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.potionButton.on("click tap", () => {
			onPotionClick();
        });


        // Button that takes player to upgrade minigame
        this.upgradeButton = new Konva.Circle({
            radius: 200,
            fill: "#401992",
            stroke: "#1b034e",
            x: 450,
            y: 500,
            visible: false,
        });
        this.group.add(this.upgradeButton);

        // Adds text for potion button
        this.upgradeButtonText = new Konva.Text({
            text: "Go to the Upgrade Minigame",
            fill: "white",
            x: 275,
            y: 450,
            fontFamily: "arial",
            fontSize: 40,
            fontStyle: "bold",
            width: 350,
            align: "center",
            lineHeight: 1.3,
            visible: false,
            listening: false,
        });
        this.group.add(this.upgradeButtonText);

        // Handle Continue Button Click
        this.upgradeButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.upgradeButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.upgradeButton.on("click tap", () => {
			onUpgradeClick();
        });

        const leave = new Konva.Group({ x: 60, y: 800 });
        leave.add(new Konva.Rect({ width: 240, height: 70, fill: "#FF9E42", cornerRadius: 10 }));
        leave.add(new Konva.Text({ text: "Leave Rest", width: 240, height: 70, align: "center", verticalAlign: "middle", fontSize: 30 }));
        leave.on("click tap", onLeaveRest);
        this.group.add(leave);
    }

    // Update the player's HP bar and percentage.
    setPlayerHealthBar(currentHealth: number, maxHealth: number): void {
        updatePlayerHealthBar(
            this.healthBar,
            this.healthPercentage,
            currentHealth,
            maxHealth
        );

        this.group.getLayer()?.batchDraw();
    }

    // Choose minigame pop up
    minigamePopUp(): void {
        this.popUpOverlay.visible(true);
        this.potionButton.visible(true);
        this.upgradeButton.visible(true);
        this.potionButtonText.visible(true);
        this.upgradeButtonText.visible(true);
    }

    // Hides the choose-a-minigame pop up so a new rest stop starts on the HP Restored panel
    hideMinigamePopUp(): void {
        this.popUpOverlay.visible(false);
        this.potionButton.visible(false);
        this.upgradeButton.visible(false);
        this.potionButtonText.visible(false);
        this.upgradeButtonText.visible(false);
    }

    setFloorNum(floor: number){
        this.floorText.text(`Floor: ${floor}`);
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
// PotionLabScreenView: difficulty choice, the PEMDAS equation, answer field, and the potion-brewed message. (Sally, Oliver; UI: Ryan)
import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";

export class PotionLabScreenView implements View {
    private group: Konva.Group;

    private healthBar: Konva.Rect;
    private basicRecipeRect: Konva.Rect;
    private basicButton: Konva.Rect;
    private advancedRecipeRect:Konva.Rect;
    private advancedButton: Konva.Rect;
    private basicText: Konva.Text;
    private advancedText: Konva.Text;
    private advancedCircle: Konva.Circle;
    private basicCircle: Konva.Circle;
    private basicDescription: Konva.Text;
    private advancedDescription: Konva.Text;
    private advancedStepsNumber: Konva.Text;
    private basicStepsNumber: Konva.Text;
    private potion: Konva.Rect;
    private chooseText: Konva.Text;
    private step1Rect: Konva.Rect;
    private step2Rect: Konva.Rect;
    private step3Rect: Konva.Rect;
    private step4Rect: Konva.Rect;
    private step5Rect: Konva.Rect;

    constructor(
        onLeaveClick : () => void,
        onBasicClick : () => void,
        onAdvancedClick : () => void,
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
            width: 300,
            height: 70,
            fill: "#0bba14",
            stroke: "#42a847",        
        });  
        this.group.add(this.healthBar);

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

        const floorText = new Konva.Text({
            x: 1200,
            y: 50,
            text: "Floor: X",
            fill: "white",
            fontSize: 40,
            fontFamily: "arial",
            fontStyle: "bold",
        });
        this.group.add(floorText);

        // Text at the top that says "Potions"
        const potionsText = new Konva.Text({
            text: "Potions",
            x: 700,
            y: 100,
            fontSize: 40,
            fontFamily: "arial",
            fontStyle: "bold",
            fill: "white",
            visible: false,
        });
        this.group.add(potionsText);

        // Adds purple rectangle at the bottom
        const bottomRect = new Konva.Rect({
            width: 1600,
            height: 300,
            fill: "#3D1B48",
            stroke: "#2b1333",
            y: 650,
        });
        this.group.add(bottomRect);

        // adds rectangle for the basic recipe
        this.basicRecipeRect = new Konva.Rect({
            width: 250,
            height: 300,
            cornerRadius: 10,
            fill: "#EEE4C8",
            stroke: "#d1c4a1",
            x: 100,
            y: 575,
            strokeWidth: 5,
            visible: true,
        });
        this.group.add(this.basicRecipeRect);

        this.basicRecipeRect.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.basicRecipeRect.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.basicRecipeRect.on("click tap", () => {
			onBasicClick();
        });

        // adds rectangle for the advanced recipe
        this.advancedRecipeRect = new Konva.Rect({
            width: 250,
            height: 300,
            cornerRadius: 10,
            fill: "#EEE4C8",
            stroke: "#d1c4a1",
            x: 400,
            y: 575,
            strokeWidth: 5,
            visible: true,
        });
        this.group.add(this.advancedRecipeRect);

        this.advancedRecipeRect.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.advancedRecipeRect.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.advancedRecipeRect.on("click tap", () => {
			onAdvancedClick();
        });

        //adds button to select basic potion
        this.basicButton = new Konva.Rect({
            width: 200,
            height: 50,
            cornerRadius: 10,
            x: 125,
            y: 600,
            fill: "#3F210B",
            stroke: "#5c3418",
            listening: false,
            visible: true,
        });
        this.group.add(this.basicButton);

        //adds button to select advanced potion
        this.advancedButton = new Konva.Rect({
            width: 200,
            height: 50,
            cornerRadius: 10,
            x: 425,
            y: 600,
            fill: "#3F210B",
            stroke: "#5c3418",
            listening: false,
            visible: true,
        });
        this.group.add(this.advancedButton);

        this.basicText = new Konva.Text({
            text: "Basic Recipe",
            fontSize: 20,
            fill: "white",
            y: 612.5,
            x: 162.5,
            listening: false,
            visible: true,
        });
        this.group.add(this.basicText);

        this.advancedText = new Konva.Text({
            text: "Advanced Recipe",
            fontSize: 20,
            fill: "white",
            y: 612.5,
            x: 450,
            listening: false,
            visible: true,
        });
        this.group.add(this.advancedText);

        this.advancedCircle = new Konva.Circle({
            radius: 25,
            fill: "#874FFF",
            stroke: "#EEE4C8",
            strokeWidth: 10,
            x: 100,
            y: 575,
            listening: false,
            visible: true,
        });
        this.group.add(this.advancedCircle);

        this.basicCircle = new Konva.Circle({
            radius: 25,
            fill: "#874FFF",
            stroke: "#EEE4C8",
            strokeWidth: 10,
            x: 400,
            y: 575,
            listening: false,
            visible: true,
        });
        this.group.add(this.basicCircle);

        this.basicDescription = new Konva.Text({
            text: "Solve 3 steps. Brew potion that restores 20% health.",
            width: 200,
            x: 130,
            y: 790,
            fontSize: 20,
            listening: false,
            visible: true,
        });
        this.group.add(this.basicDescription);

        this.advancedDescription = new Konva.Text({
            text: "Solve 5 steps. Brew potion that restores 50% health.",
            width: 200,
            x: 430,
            y: 790,
            fontSize: 20,
            listening: false,
            visible: true,
        });
        this.group.add(this.advancedDescription);

        this.advancedStepsNumber = new Konva.Text({
            text: "5",
            fill: "white",
            fontSize: 20,
            x: 394,
            y: 565,
            listening: false,
            visible: true,
        });
        this.group.add(this.advancedStepsNumber);

        this.basicStepsNumber = new Konva.Text({
            text: "3",
            fill: "white",
            fontSize: 20,
            x: 94,
            y: 565,
            listening: false,
            visible: true,
        });
        this.group.add(this.basicStepsNumber);

        const leaveButton = new Konva.Rect({
            width: 200,
            height: 75,
            cornerRadius: 10,
            fill: "#F24822",
            stroke: "white",
            strokeWidth: 5,
            x: 1300,
            y: 750,
        });
        this.group.add(leaveButton);

        leaveButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		leaveButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        leaveButton.on("click tap", () => {
			onLeaveClick();
        });

        const leaveText = new Konva.Text({
            text: "Leave",
            fontSize: 40,
            fill: "white",
            x: 1345,
            y: 765,
        });
        this.group.add(leaveText);

        this.potion = new Konva.Rect({
            height: 300,
            width: 200,
            x: 700,
            y: 200,
            fill: "white",
            stroke: "gray",
            cornerRadius: 10,
            visible: true,
        });
        this.group.add(this.potion);

        this.chooseText = new Konva.Text({
            text: "Choose a Recipe:",
            fill: "white",
            fontSize: 40,
            x: 175,
            y: 300,
            fontStyle: "bold",
            visible: true,
        });
        this.group.add(this.chooseText);

        this.step1Rect = new Konva.Rect({
            width: 200,
            height: 250,
            cornerRadius: 10,
            fill: "#EEE4C8",
            stroke: "#d1c4a1",
            x: 50,
            y: 600,
            strokeWidth: 5,
            visible: false,
        });
        this.group.add(this.step1Rect);

        this.step2Rect = new Konva.Rect({
            width: 200,
            height: 250,
            cornerRadius: 10,
            fill: "#EEE4C8",
            stroke: "#d1c4a1",
            x: 300,
            y: 600,
            strokeWidth: 5,
            visible: false,
        });
        this.group.add(this.step2Rect);

        this.step3Rect = new Konva.Rect({
            width: 200,
            height: 250,
            cornerRadius: 10,
            fill: "#EEE4C8",
            stroke: "#d1c4a1",
            x: 550,
            y: 600,
            strokeWidth: 5,
            visible: false,
        });
        this.group.add(this.step3Rect);

        this.step4Rect = new Konva.Rect({
            width: 200,
            height: 250,
            cornerRadius: 10,
            fill: "#EEE4C8",
            stroke: "#d1c4a1",
            x: 800,
            y: 600,
            strokeWidth: 5,
            visible: false,
        });
        this.group.add(this.step4Rect);

        this.step5Rect = new Konva.Rect({
            width: 200,
            height: 250,
            cornerRadius: 10,
            fill: "#EEE4C8",
            stroke: "#d1c4a1",
            x: 1050,
            y: 600,
            strokeWidth: 5,
            visible: false,
        });
        this.group.add(this.step5Rect);

    }

    // set the player's health bar
    setPlayerHealthBar(currentHealth: number, maxHealth: number): void {
        if (maxHealth <= 0) {
            this.healthBar.width(0);
            this.group.getLayer()?.batchDraw();
            return;
        }

        const percentage = Math.max(0, Math.min(currentHealth / maxHealth, 1));

        this.healthBar.width(400 * percentage);

        this.group.getLayer()?.batchDraw();
    }

    // Starts Basic Recipe
    startBasicRecipe() : void{
        this.basicRecipeRect.visible(false);
        this.advancedRecipeRect.visible(false);
        this.basicButton.visible(false);
        this.advancedButton.visible(false);
        this.basicCircle.visible(false);
        this.advancedCircle.visible(false);
        this.basicDescription.visible(false);
        this.advancedDescription.visible(false);
        this.basicStepsNumber.visible(false);
        this.advancedStepsNumber.visible(false);
        this.basicText.visible(false);
        this.advancedText.visible(false);
        this.chooseText.visible(false);
        this.potion.visible(false);

        this.step1Rect.visible(true);
        this.step2Rect.visible(true);
        this.step3Rect.visible(true);
    }

    // Starts Advanced Recipe
    startAdvancedRecipe() : void{
        this.basicRecipeRect.visible(false);
        this.advancedRecipeRect.visible(false);
        this.basicButton.visible(false);
        this.advancedButton.visible(false);
        this.basicCircle.visible(false);
        this.advancedCircle.visible(false);
        this.basicDescription.visible(false);
        this.advancedDescription.visible(false);
        this.basicStepsNumber.visible(false);
        this.advancedStepsNumber.visible(false);
        this.basicText.visible(false);
        this.advancedText.visible(false);
        this.chooseText.visible(false);
        this.potion.visible(false);

        this.step1Rect.visible(true);
        this.step2Rect.visible(true);
        this.step3Rect.visible(true);
        this.step4Rect.visible(true);
        this.step5Rect.visible(true);
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
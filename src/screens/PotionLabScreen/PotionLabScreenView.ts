// PotionLabScreenView: potion type and recipe choice, the PEMDAS equation, typed answer, and the result. (UI: Ryan; logic: Sally)

import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";
import type { PotionType } from "../../../backend/game/Potion.ts";
import {
    createHealthPercentage,
    updatePlayerHealthBar
} from "../../PlayerHealthBar.ts";

const POTION_TYPES: { type: PotionType; label: string }[] = [
    { type: "healing", label: "Healing" },
    { type: "strength", label: "Strength" },
    { type: "poison", label: "Poison" },
];

export class PotionLabScreenView implements View {
    private group: Konva.Group;

    private healthBar: Konva.Rect;
    private healthPercentage: Konva.Text;
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
    private potion: Konva.Image;
    private chooseText: Konva.Text;
    private equationTextBox: Konva.Rect;
    private answerBox: Konva.Rect;
    private submitAnswerButton: Konva.Rect;
    private submitText: Konva.Text;
    private responseText: Konva.Text;
    private leaveButton: Konva.Rect;
    private leaveText:Konva.Text;
    private successText: Konva.Text;
    private continueButton: Konva.Rect;
    private continueText: Konva.Text;
    private typeButtons = new Map<PotionType, Konva.Rect>();
    private typeLabels: Konva.Text[] = [];
    private equationText: Konva.Text;
    private answerValue: Konva.Text;
    private messageText: Konva.Text;
    private answerBuffer = "";
    private answering = false;
    private readonly potionStartY = 200;
    private readonly onSubmit: () => void;
    private readonly canType: () => boolean;
    private pemdasHelpButton: Konva.Rect;
    private pemdasHelpText: Konva.Text;
    private floorText: Konva.Text;

    constructor(
        onLeaveClick : () => void,
        onBasicClick : () => void,
        onAdvancedClick : () => void,
        onSubmitClick : () => void,
        onContinueClick : () => void,
        onTypeClick : (type: PotionType) => void,
        onPemdasHelpClick : () => void = () => {},
        canType : () => boolean = () => true,
    ){

    this.onSubmit = onSubmitClick;
    this.canType = canType;

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
            text: "Pick a potion first.",
            width: 200,
            x: 130,
            y: 790,
            fontSize: 20,
            listening: false,
            visible: true,
        });
        this.group.add(this.basicDescription);

        this.advancedDescription = new Konva.Text({
            text: "Pick a potion first.",
            width: 200,
            x: 430,
            y: 790,
            fontSize: 20,
            listening: false,
            visible: true,
        });
        this.group.add(this.advancedDescription);

        this.advancedStepsNumber = new Konva.Text({
            text: "3",
            fill: "white",
            fontSize: 20,
            x: 394,
            y: 565,
            listening: false,
            visible: true,
        });
        this.group.add(this.advancedStepsNumber);

        this.basicStepsNumber = new Konva.Text({
            text: "2",
            fill: "white",
            fontSize: 20,
            x: 94,
            y: 565,
            listening: false,
            visible: true,
        });
        this.group.add(this.basicStepsNumber);

        this.leaveButton = new Konva.Rect({
            width: 200,
            height: 75,
            cornerRadius: 10,
            fill: "#F24822",
            stroke: "white",
            strokeWidth: 5,
            x: 1300,
            y: 750,
        });
        this.group.add(this.leaveButton);

        this.leaveButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.leaveButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.leaveButton.on("click tap", () => {
			onLeaveClick();
        });

        this.leaveText = new Konva.Text({
            text: "Leave",
            fontSize: 40,
            fill: "white",
            x: 1345,
            y: 765,
            listening: false,
        });
        this.group.add(this.leaveText);

        const potionImage = new Image();

        potionImage.src = "/Potion.png";

        this.potion = new Konva.Image({
            image: potionImage,
            height: 300,
            width: 200,
            x: 700,
            y: 200,
            visible: true,
        });

        this.group.add(this.potion);

        this.chooseText = new Konva.Text({
            text: "Choose a Potion:",
            fill: "white",
            fontSize: 40,
            x: 175,
            y: 300,
            fontStyle: "bold",
            visible: true,
        });
        this.group.add(this.chooseText);


        // Create Text Box for Equation
        this.equationTextBox = new Konva.Rect({
            cornerRadius: 10,
            width: 800,
            height: 150,
            x: 400,
            y: 200,
            visible: false,
            fill: "#feffe0",
            stroke: "black",
        });
        this.group.add(this.equationTextBox);

        // The equation itself, inside the box
        this.equationText = new Konva.Text({
            x: 400, y: 200, width: 800, height: 150,
            text: "", fontSize: 60, fontFamily: "arial", fontStyle: "bold",
            align: "center", verticalAlign: "middle",
            visible: false, listening: false,
        });
        this.group.add(this.equationText);

        // Box for player answer
        this.answerBox = new Konva.Rect({
            width: 300,
            height: 75,
            cornerRadius: 10,
            fill: "white",
            stroke: "#cc721d",
            x: 850,
            y: 400,
            visible: false,
            strokeWidth: 10,
        });
        this.group.add(this.answerBox);

        // What the player has typed so far
        this.answerValue = new Konva.Text({
            x: 865, y: 415, width: 270, height: 50,
            text: "_", fontSize: 40, fill: "black",
            visible: false, listening: false,
        });
        this.group.add(this.answerValue);

        // Button to submit answer
        this.submitAnswerButton = new Konva.Rect({
            width: 200,
            height: 75,
            fill: "#FF9E42",
            stroke: "#cc721d", 
            x: 700,
            y: 500,
            visible: false,
            cornerRadius: 10,
        });
        this.group.add(this.submitAnswerButton);

        // Text prompting user for answer
        this.responseText = new Konva.Text({
            text: "Your Answer:",
            fontSize: 40,
            fontFamily: "arial",
            fontStyle: "bold",
            fill: "#FF9E42",
            x: 550,
            y: 420,
            visible: false,
        });
        this.group.add(this.responseText);

        // Text for submit button
        this.submitText = new Konva.Text({
            text: "SUBMIT",
            fontSize: 40,
            fontFamily: "arial",
            fontStyle: "bold",
            x: 725,
            y: 520,
            visible: false,
            listening: false,
        });
        this.group.add(this.submitText);

        this.pemdasHelpButton = new Konva.Rect({
            width: 200,
            height: 75,
            cornerRadius: 10,
            fill: "#FF9E42",
            stroke: "#cc721d",
            x: 1075,
            y: 750,
            visible: false,
        });
        this.group.add(this.pemdasHelpButton);

        this.pemdasHelpText = new Konva.Text({
            text: "Hint",
            fontSize: 40,
            fontFamily: "arial",
            fontStyle: "bold",
            fill: "#000000",
            x: 1075,
            y: 750,
            width: 200,
            height: 75,
            align: "center",
            verticalAlign: "middle",
            visible: false,
            listening: false,
        });
        this.group.add(this.pemdasHelpText);

        this.pemdasHelpButton.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
            this.pemdasHelpButton.fill("#B678D0");
        });

        this.pemdasHelpButton.on("mouseleave", () => {
            document.body.style.cursor = "default";
            this.pemdasHelpButton.fill("#FF9E42");
        });

        this.pemdasHelpButton.on("click tap", () => {
            document.body.style.cursor = "default";
            this.pemdasHelpButton.fill("#FF9E42");
            onPemdasHelpClick();
        });

        // Handle Submit Button Click
        this.submitAnswerButton.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
            this.submitAnswerButton.fill("#B678D0");
        });

        this.submitAnswerButton.on("mouseleave", () => {
            document.body.style.cursor = "default";
            this.submitAnswerButton.fill("#FF9E42");
        });

        this.submitAnswerButton.on("click tap", () => {
            onSubmitClick();
        });

        this.successText = new Konva.Text({
            fill: "green",
            fontSize: 80,
            fontStyle: "bold",
            fontFamily: "arial",
            text: "Potion Successfully Brewed!",
            x: 300,
            y: 175,
            visible: false,
        });
        this.group.add(this.successText);


        this.continueButton = new Konva.Rect({
            width: 200,
            height: 75,
            cornerRadius: 10,
            fill: "#F24822",
            stroke: "white",
            strokeWidth: 5,
            x: 700,
            y: 750,
            visible: false,
        });
        this.group.add(this.continueButton);

        this.continueButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.continueButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        this.continueButton.on("click tap", () => {
			onContinueClick();
        });

        this.continueText = new Konva.Text({
            text: "Continue",
            fontSize: 40,
            fill: "white",
            x: 720,
            y: 765,
            listening: false,
            visible: false,
        });
        this.group.add(this.continueText);

        // Healing / Strength / Poison buttons
        POTION_TYPES.forEach(({ type, label }, i) => {
            const button = new Konva.Rect({
                x: 100 + i * 180, y: 370, width: 160, height: 60,
                cornerRadius: 10, fill: "#3F210B", stroke: "#EEE4C8", strokeWidth: 3,
            });
            button.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
            button.on("mouseleave", () => { document.body.style.cursor = "default"; });
            button.on("click tap", () => onTypeClick(type));
            const text = new Konva.Text({
                x: 100 + i * 180, y: 370, width: 160, height: 60,
                text: label, fontSize: 26, fill: "white",
                align: "center", verticalAlign: "middle", listening: false,
            });
            this.typeButtons.set(type, button);
            this.typeLabels.push(text);
            this.group.add(button, text);
        });

        // Hints and results ("Pick a potion first", "Not quite! ...")
        this.messageText = new Konva.Text({
            x: 100, y: 450, width: 550,
            text: "", fontSize: 26, fill: "white", fontFamily: "arial",
            listening: false,
        });
        this.group.add(this.messageText);
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

    // Screen 1: potion types and recipe cards; also clears anything left from the last visit
    showChoices(): void {
        this.answering = false;
        this.setChoicesVisible(true);
        this.setEquationVisible(false);
        this.successText.visible(false);
        this.continueButton.visible(false);
        this.continueText.visible(false);
        this.leaveButton.visible(true);
        this.leaveText.visible(true);
        this.potion.y(this.potionStartY);
        this.potion.visible(true);
        this.setSelectedType(null);
        this.messageText.setAttrs({ x: 100, y: 450, width: 550, align: "left" });
        this.showMessage("");
    }

    // Highlights the chosen potion type
    setSelectedType(type: PotionType | null): void {
        this.typeButtons.forEach((button, buttonType) => {
            button.fill(buttonType === type ? "#874FFF" : "#3F210B");
        });
        this.group.getLayer()?.batchDraw();
    }

    setRecipeDescriptions(basic: string, advanced: string): void {
        this.basicDescription.text(basic);
        this.advancedDescription.text(advanced);
        this.group.getLayer()?.batchDraw();
    }

    // Screen 2: the equation and the answer box
    showEquation(equation: string): void {
        this.setChoicesVisible(false);
        this.potion.visible(false);
        this.equationText.text(equation);
        this.answerBuffer = "";
        this.answerValue.text("_");
        this.setEquationVisible(true);
        this.answering = true;
        this.messageText.setAttrs({ x: 400, y: 600, width: 800, align: "center" });
        this.showMessage("");
    }

    // Screen 3: potion brewed (brewed = true) or not, then Continue
    showResult(brewed: boolean, message: string): void {
        this.answering = false;
        this.setChoicesVisible(false);
        this.setEquationVisible(false);
        this.leaveButton.visible(false);
        this.leaveText.visible(false);
        this.successText.visible(brewed);
        this.potion.y(this.potionStartY + 100);
        this.potion.visible(brewed);
        this.continueButton.visible(true);
        this.continueText.visible(true);
        this.messageText.setAttrs({ x: 300, y: brewed ? 650 : 350, width: 1000, align: "center" });
        this.showMessage(message);
    }

    showMessage(message: string): void {
        this.messageText.text(message);
        this.messageText.visible(message !== "");
        this.group.getLayer()?.batchDraw();
    }

    // The typed answer, or null if nothing (or only "-") was typed
    getAnswer(): number | null {
        if (this.answerBuffer === "" || this.answerBuffer === "-") return null;
        return Number(this.answerBuffer);
    }

    private setChoicesVisible(visible: boolean): void {
        [
            this.basicRecipeRect, this.advancedRecipeRect, this.basicButton, this.advancedButton,
            this.basicText, this.advancedText, this.basicCircle, this.advancedCircle,
            this.basicDescription, this.advancedDescription, this.basicStepsNumber, this.advancedStepsNumber,
            this.chooseText, ...this.typeButtons.values(), ...this.typeLabels,
        ].forEach((node) => node.visible(visible));
    }

    private setEquationVisible(visible: boolean): void {
        [
            this.equationTextBox, this.equationText, this.answerBox, this.answerValue,
            this.submitAnswerButton, this.submitText, this.responseText,
            this.pemdasHelpButton, this.pemdasHelpText,
        ].forEach((node) => node.visible(visible));
    }

    // Typing: digits, a minus sign at the start, Backspace, Enter to submit
    private readonly handleKeyDown = (event: KeyboardEvent): void => {
        if (!this.answering || !this.group.visible() || !this.canType()) return;
        if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
        if (/^[0-9]$/.test(event.key)) {
            if (this.answerBuffer.length < 12) this.answerBuffer += event.key;
        } else if (event.key === "-" && this.answerBuffer === "") {
            this.answerBuffer = "-";
        } else if (event.key === "Backspace") {
            this.answerBuffer = this.answerBuffer.slice(0, -1);
        } else if (event.key === "Enter") {
            event.preventDefault();
            this.onSubmit();
            return;
        } else return;
        event.preventDefault();
        this.answerValue.text(this.answerBuffer || "_");
        this.group.getLayer()?.batchDraw();
    };

    setFloorNum(floor: number){
        this.floorText.text(`Floor: ${floor}`);
    }


    /**
     * Show the screen
     */
    show(): void {
        window.addEventListener("keydown", this.handleKeyDown);
        this.group.visible(true);
        this.group.getLayer()?.draw();
    }

    /**
     * Hide the screen
     */
    hide(): void {
        window.removeEventListener("keydown", this.handleKeyDown);
        this.answering = false;
        this.group.visible(false);
        this.group.getLayer()?.draw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }

}
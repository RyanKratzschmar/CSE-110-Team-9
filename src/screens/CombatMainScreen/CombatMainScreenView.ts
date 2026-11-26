import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";

import {
    createHealthPercentage,
    updatePlayerHealthBar
} from "../../PlayerHealthBar.ts";

export class CombatMainScreenView implements View {
    private group: Konva.Group;

    // Declare all shapes that must be updated mid game
    private dimOverlay: Konva.Rect;
    private hintPopUp: Konva.Rect;
    private hintXButton: Konva.Rect;
    private hintXText: Konva.Text;
    private enemyHealthBar: Konva.Rect;
    private enemyHealthPercentage: Konva.Text;
    private victoryText: Konva.Text;
    private defeatText: Konva.Text;
    private potionStatusText: Konva.Text;
    private attackButton: Konva.Rect;
    private attackButtonText: Konva.Text;
    private potionButton: Konva.Rect;
    private potionButtonText: Konva.Text;
    private enemy: Konva.Image;
    private player: Konva.Image;
    private enemyHealthBarBG: Konva.Rect;
    private popUpOverlay: Konva.Rect;
    private equationTextBox: Konva.Rect;
    private hintButton: Konva.Rect;
    private hintText: Konva.Text;
    private equationText: Konva.Text;
    private answerBox: Konva.Rect;
    private submitAnswerButton: Konva.Rect;
    private submitText: Konva.Text;
    private responseText: Konva.Text;
    private healthBar: Konva.Rect;
    private healthPercentage: Konva.Text;
    private answerBuffer = "";
    private answerValue!: Konva.Text;
    private solving = false;
    private awaitingContinue = false;
    private feedbackText!: Konva.Text;
    private explanationButton: Konva.Rect;
    private explanationText: Konva.Text;
    private cancelAttackButton: Konva.Rect;
    private cancelAttackText: Konva.Text;
    private floorText: Konva.Text;
    private idleAnimation?: Konva.Animation;
    private isAttacking = false;

    constructor(
        onHintClick : () => void,
        onHintXClick : () => void,
        onAttackClick : () => void,
        private readonly onSubmitClick: (answer: number | null) => void,
        onExplanationClick: () => void,
        onPotionClick: () => void,
        private readonly canInput: () => boolean = () => true,
        onCancelAttack?: () => void
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

        // Button For Settings
        /*
        const settingsButton = new Konva.Circle({
            x: STAGE_WIDTH - 100,
            y: 75,
            radius: 60,
            fill: "#94948e",
        });
        this.group.add(settingsButton);
        */

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

                // Handle Hint Click
        this.potionButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		this.potionButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
         
		});

        this.potionButton.on("click tap", () => {
			onPotionClick();
        });

        //Text that says "Potion"
        this.potionButtonText = new Konva.Text({
            text: "Potion",
            y: 232.5,
            x: 130,
            width: 150,
            fontFamily: "Arial",
			fontSize: 30,
            fill: "#ffff",
            listening: false,
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
            this.readyStance();
			onAttackClick();
        });

        // The player Character
        const playerImage = new Image();
        playerImage.src = "/player.png";
        this.player = new Konva.Image({
            width: 280,
            height: 350,
            x: 175,
            y: 350,
            image: playerImage,
        });
        playerImage.onload = () => {
            this.group.getLayer()?.batchDraw();
        };
        this.group.add(this.player);

        // The enemy character
        const enemyImage = new Image();
        enemyImage.src = "/enemy.png";
        this.enemy = new Konva.Image({
            width: 280,
            height: 350,
            x: STAGE_WIDTH - 455,
            y: 350,
            image: enemyImage,
        });
        enemyImage.onload = () => {
            this.group.getLayer()?.batchDraw();
        };
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

        // Display the monster's HP percentage.
        this.enemyHealthPercentage = createHealthPercentage(
            this.enemyHealthBar, 350
        );
        this.group.add(this.enemyHealthPercentage);

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
        */

        // Text Denoting Which Floor player is on.
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

        // Create Hint Button
        this.hintButton = new Konva.Rect({
            x: 1300,
            y: 787.5,
            width: 200,
            height: 75,
            fill: "#FF9E42",
            stroke: "#cc721d",
            cornerRadius: 10,
            visible: false,
        })
        this.group.add(this.hintButton);

        // Handle Hint Click
        this.hintButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
            this.hintButton.fill("#B678D0");
		});

		this.hintButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
            this.hintButton.fill("#FF9E42");
		});

        this.hintButton.on("click tap", () => {
			onHintClick();
        });

        // Text that says "get hint"
        this.hintText = new Konva.Text({
            x: 1320,
            y: 802.5,
            fontSize: 40,
            text: "Get Hint",
            fill: "#000000",
            fontFamily: "arial",
            fontStyle: "bold",
            listening: false,
            visible: false,
        });
        this.group.add(this.hintText);

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

        // What the last potion did and which potion effects are still active, between the player and the enemy
        this.potionStatusText = new Konva.Text({
            x: 500,
            y: 400,
            width: 600,
            align: "center",
            lineHeight: 1.3,
            text: "",
            fill: "#F5E6C8",
            fontSize: 30,
            fontStyle: "bold",
            fontFamily: "arial",
            listening: false,
        });
        this.group.add(this.potionStatusText);

        // Create Explanation Button
        this.explanationButton = new Konva.Rect({
            x: 1300,
            y: 787.5,
            width: 200,
            height: 75,
            fill: "#FF9E42",
            stroke: "#cc721d",
            cornerRadius: 10,
            visible: false,
        });
        this.group.add(this.explanationButton);

        this.explanationButton.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
            this.explanationButton.fill("#B678D0");
        });

        this.explanationButton.on("mouseleave", () => {
            document.body.style.cursor = "default";
            this.explanationButton.fill("#FF9E42");
        });

        this.explanationButton.on("click tap", () => {
            document.body.style.cursor = "default";
            onExplanationClick();
        });

        // Text that says "Explain"
        this.explanationText = new Konva.Text({
            x: 1300,
            y: 802.5,
            width: 200,
            align: "center",
            fontSize: 40,
            text: "Explain",
            fill: "#000000",
            fontFamily: "arial",
            fontStyle: "bold",
            listening: false,
            visible: false,
        });
        this.group.add(this.explanationText);

        // Create overlay when equation is being solved
        this.popUpOverlay = new Konva.Rect({
            x: 0,
            y: 150,
            width: STAGE_WIDTH,
            height: 600,
            fill: "rgba(35, 15, 45, 0.75)",
            visible: false,
        });
        this.group.add(this.popUpOverlay);
        this.player.moveToTop();
        this.enemy.moveToTop();

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

        // Text For Math Problem
        this.equationText = new Konva.Text({
            text: "8 x 8",
            fontFamily: "arial",
            fontSize: 60,
            x: 725,
            y: 250,
            visible: false,
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
        this.answerValue = new Konva.Text({
            x: 865, y: 415, width: 270, height: 50,
            text: "_", fontSize: 40, fill: "black", visible: false,
            listening: false,
        });
        this.group.add(this.answerValue);
        this.feedbackText = new Konva.Text({
            x: 400, y: 510, width: 800, height: 75,
            text: "", fontSize: 30, align: "center", visible: false,
            listening: false,
        });
        this.group.add(this.feedbackText);

        // Button to submit answer
        this.submitAnswerButton = new Konva.Rect({
            width: 200,
            height: 100,
            fill: "#FF9E42",
            stroke: "#cc721d", 
            x: 700,
            y: 600,
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
            y: 630,
            visible: false,
            listening: false,
        });
        this.group.add(this.submitText);

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
            this.submitAnswer();
        });

        // Button to cancel attack and return to action select
        this.cancelAttackButton = new Konva.Rect({
            width: 200,
            height: 100,
            fill: "#e53e3e",
            stroke: "#c53030",
            x: 450,
            y: 600,
            visible: false,
            cornerRadius: 10,
        });
        this.group.add(this.cancelAttackButton);

        this.cancelAttackText = new Konva.Text({
            text: "BACK",
            fontSize: 40,
            fontFamily: "arial",
            fontStyle: "bold",
            x: 450,
            y: 630,
            width: 200,
            align: "center",
            fill: "white",
            visible: false,
            listening: false,
        });
        this.group.add(this.cancelAttackText);

        this.cancelAttackButton.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
            this.cancelAttackButton.fill("#f56565");
        });

        this.cancelAttackButton.on("mouseleave", () => {
            document.body.style.cursor = "default";
            this.cancelAttackButton.fill("#e53e3e");
        });

        this.cancelAttackButton.on("click tap", () => {
            document.body.style.cursor = "default";
            this.returnToCombat();
            onCancelAttack?.();
        });

        /////////////////////////////////////////////////
        // POP UPS //////////////////////////////////////
        // MUST BE AT BOTTOM ////////////////////////////
        /////////////////////////////////////////////////

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

    // Updates the monster's HP bar and percentage.
    updateEnemyHealthBar(currentHealth: number, maxHealth: number): void {
        updatePlayerHealthBar(
            this.enemyHealthBar,
            this.enemyHealthPercentage,
            currentHealth,
            maxHealth
        );

        this.group.getLayer()?.batchDraw();
    }

    // Updates the player's HP bar and percentage.
    setPlayerHealthBar(currentHealth: number, maxHealth: number): void {
        updatePlayerHealthBar(
            this.healthBar,
            this.healthPercentage,
            currentHealth,
            maxHealth
        );

        this.group.getLayer()?.batchDraw();
    }

    // Resets victory or defeat text, and shows attack and potion buttons
    // Shows a line about potions under the header; an empty string clears it
    setPotionStatus(message: string): void {
        this.potionStatusText.text(message);
        this.group.getLayer()?.batchDraw();
    }

    resetFight(): void {
        this.potionStatusText.text("");
        this.victoryText.visible(false);
        this.defeatText.visible(false);

        this.potionButton.visible(true);
        this.attackButton.visible(true);

        this.potionButtonText.visible(true);
        this.attackButtonText.visible(true);
    }

    // Changes display to account for player winning or losing
    endGameText(win: boolean): void {
        this.potionStatusText.text("");
        if(win){
            this.victoryText.visible(true);
        } else {
            this.defeatText.visible(true);
        }
        this.attackButton.visible(false);
        this.attackButtonText.visible(false);
        this.potionButton.visible(false);
        this.potionButtonText.visible(false);
        this.cancelAttackButton.visible(false);
        this.cancelAttackText.visible(false);

        this.group.getLayer()?.batchDraw();
    }

    // Pop Up Equation Solving
    solveEquation(): void{
        this.solving = true;
        this.potionStatusText.visible(false);
        this.feedbackText.visible(true);
        this.answerValue.visible(true);
        this.popUpOverlay.visible(true);
        this.player.moveToTop();
        this.enemy.moveToTop();
        this.equationTextBox.visible(true);
        this.hintButton.visible(true);
        this.hintText.visible(true);
        this.equationText.visible(true);
        this.answerBox.visible(true);
        this.submitAnswerButton.visible(true);
        this.submitText.visible(true);
        this.responseText.visible(true);
        this.cancelAttackButton.visible(true);
        this.cancelAttackText.visible(true);
    }


    // Goes from equation back to combat screen
    returnToCombat(): void {
        this.solving = false;
        this.potionStatusText.visible(true);
        this.feedbackText.visible(false);
        this.answerValue.visible(false);
        this.popUpOverlay.visible(false);
        this.equationTextBox.visible(false);
        this.hintButton.visible(false);
        this.hintText.visible(false);
        this.equationText.visible(false);
        this.answerBox.visible(false);
        this.submitAnswerButton.visible(false);
        this.submitText.visible(false); 
        this.responseText.visible(false);
        this.explanationButton.visible(false);
        this.explanationText.visible(false);
        this.cancelAttackButton.visible(false);
        this.cancelAttackText.visible(false);
    }

    // Swaps the Get Hint button for the Explain button (used after a wrong answer)
    showExplanationButton(): void {
        this.hintButton.visible(false);
        this.hintText.visible(false);
        this.explanationButton.visible(true);
        this.explanationText.visible(true);
        this.group.getLayer()?.batchDraw();
    }

    /**
	 * Show the screen
	 */
	show(): void {
        window.addEventListener("keydown", this.handleKeyDown);
		this.group.visible(true);
        this.startIdleAnimation();
		this.group.getLayer()?.draw();
	}

	/**
	 * Hide the screen
	 */
	hide(): void {
        window.removeEventListener("keydown", this.handleKeyDown);
        this.stopIdleAnimation();
        this.returnToCombat();
		this.group.visible(false);
		this.group.getLayer()?.draw();
	}

    startIdleAnimation(): void {
        if (this.idleAnimation) {
            this.idleAnimation.start();
            return;
        }
        const layer = this.group.getLayer();
        let time = 0;
        this.idleAnimation = new Konva.Animation((frame) => {
            if (!frame) return;
            time += frame.timeDiff / 1000;
            const bob = Math.sin(time * 3) * 6;
            if (!this.isAttacking) {
                this.player.y(350 + bob);
                this.enemy.y(350 - bob);
            }
        }, layer);
        this.idleAnimation.start();
    }

    stopIdleAnimation(): void {
        this.idleAnimation?.stop();
        this.player.y(350);
        this.enemy.y(350);
    }

    readyStance(): void {
        const originalX = 175;
        new Konva.Tween({
            node: this.player,
            duration: 0.12,
            x: originalX + 25,
            onFinish: () => {
                new Konva.Tween({
                    node: this.player,
                    duration: 0.15,
                    x: originalX,
                }).play();
            },
        }).play();
    }

    setQuestion(question: string): void {
        this.equationText.text(question);
        this.answerBuffer = "";
        this.answerValue.text("_");
        this.setFeedback("");
        this.group.getLayer()?.batchDraw();
    }

    setFeedback(message: string, correct: boolean | null = null, awaitingContinue = false): void {
        this.awaitingContinue = awaitingContinue;
        this.feedbackText.text(message);
        this.feedbackText.fill(correct === true ? "#5FD068" : correct === false ? "#FF9E42" : "white");
        this.submitText.text(awaitingContinue ? "CONTINUE" : "SUBMIT");
        this.submitText.fontSize(awaitingContinue ? 26 : 40);
        this.group.getLayer()?.batchDraw();
    }

    private submitAnswer(): void {
        if (!this.solving || !this.group.visible() || !this.canInput()) return;
        const answer = this.answerBuffer === "" ? null : Number(this.answerBuffer);
        this.onSubmitClick(answer);
    }

    private readonly handleKeyDown = (event: KeyboardEvent): void => {
        if (!this.solving || !this.group.visible() || !this.canInput()) return;
        if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
        if (this.awaitingContinue && event.key !== "Enter") return;
        if (/^[0-9]$/.test(event.key)) {
            if (this.answerBuffer.length < 12) this.answerBuffer += event.key;
        } else if (event.key === "Backspace") {
            this.answerBuffer = this.answerBuffer.slice(0, -1);
        } else if (event.key === "Enter") {
            this.submitAnswer();
        } else return;
        event.preventDefault();
        this.answerValue.text(this.answerBuffer || "_");
        this.group.getLayer()?.batchDraw();
    };

    setFloorNum(floor: number){
        this.floorText.text(`Floor: ${floor}`);
    }
    
    animateAttack(isPlayer: boolean): void {
        this.isAttacking = true;
        const attacker = isPlayer ? this.player : this.enemy;
        const originalX = isPlayer ? 175 : STAGE_WIDTH - 455;
        const stepBack = isPlayer ? -30 : 30;
        const lungeDistance = isPlayer ? 180 : -180;

        // 1. Step backward slightly (wind-up)
        new Konva.Tween({
            node: attacker,
            duration: 0.15,
            x: originalX + stepBack,
            onFinish: () => {
                // 2. Dash forward to strike!
                new Konva.Tween({
                    node: attacker,
                    duration: 0.18,
                    x: originalX + lungeDistance,
                    onFinish: () => {
                        // Impact: target takes damage
                        this.animateDamage(!isPlayer);

                        // 3. Move back to original position
                        new Konva.Tween({
                            node: attacker,
                            duration: 0.22,
                            x: originalX,
                            onFinish: () => {
                                this.isAttacking = false;
                            },
                        }).play();
                    },
                }).play();
            },
        }).play();
    }

    animateDamage(isPlayer: boolean): void {
        const target = isPlayer ? this.player : this.enemy;
        const originalX = isPlayer ? 175 : STAGE_WIDTH - 455;

        let shakes = 0;
        const interval = setInterval(() => {
            target.x(originalX + (shakes % 2 === 0 ? 16 : -16));
            target.opacity(shakes % 2 === 0 ? 0.35 : 1);
            this.group.getLayer()?.batchDraw();
            shakes++;
            if (shakes > 6) {
                clearInterval(interval);
                target.x(originalX);
                target.opacity(1);
                this.group.getLayer()?.batchDraw();
            }
        }, 45);
    }

	getGroup(): Konva.Group {
		return this.group;
	}
}
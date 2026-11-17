import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";
import { UPGRADE_INFO } from "./UpgradeMinigameScreenModel.ts";
import type { UpgradeMinigameState, UpgradePhase, UpgradeType } from "./UpgradeMinigameScreenModel.ts";

//Functions the view calls when the player clicks a button or presses a key
export interface UpgradeMinigameViewHandlers {
    onChoose(type: UpgradeType): void;
    onStart(): void;
    onSubmit(answer: string): void;
    onNext(): void;
    onBack(): void;
    onLeave(): void;
}

const HEADER_HEIGHT = 110;
const FOOTER_Y = 770;

const PANEL_X = 120;
const PANEL_Y = 160;
const PANEL_W = 1360;
const PANEL_H = 560;

const BOX_X = 150;
const BOX_Y = 190;
const BOX_W = 760;
const BOX_H = 500;

const HP_BAR_X = 100;
const HP_BAR_Y = 20;
const HP_BAR_W = 400;
const HP_BAR_H = 70;
const HP_GREEN = "#0bba14";
const SCORE_ORANGE = "#FF9E42";

const RIGHT_X = BOX_X + BOX_W;
const RIGHT_W = PANEL_X + PANEL_W - RIGHT_X;

const MAX_ANSWER_LENGTH = 4;
const UPGRADE_TYPES: readonly UpgradeType[] = ["weapon", "armor", "potion"];

const DARK = "#2B1638";
const BG = "#433550";
const CREAM = "#EFE3C2";
const CREAM_BORDER = "#C9B98F";
const LAVENDER = "#DCCEF7";
const PURPLE = "#7B4FD6";
const RED = "#F04A23";
const YELLOW = "#FFC943";
const GREEN = "#5FD068";
const BLUE = "#2F9BF4";
const ORANGE = "#FF7A1A";
const HOVER = "#B678D0";
const FONT = "Arial";
const MONO = "Courier New, monospace";

const FEEDBACK_TEXT = {
    correct: { text: "Correct!", color: "#2E8B3E" },
    incorrect: { text: "Incorrect answer!", color: "#D7263D" },
    invalid: { text: "Type a number first.", color: "#4B2C83" }
} as const;

//Draws the upgrade minigame: one screen whose middle panel and footer buttons change with the phase
export class UpgradeMinigameScreenView implements View {
    private readonly group: Konva.Group;
    private readonly buttonBgs: Konva.Rect[] = [];

    private readonly choosePanel: Konva.Group;
    private readonly workshopPanel: Konva.Group;
    private readonly completePanel: Konva.Group;

    private readonly healthBar: Konva.Rect;

    private readonly timerText: Konva.Text;
    private readonly solvedText: Konva.Text;
    private readonly problemText: Konva.Text;
    private readonly instructionsText: Konva.Text;
    private readonly answerGroup: Konva.Group;
    private readonly answerText: Konva.Text;
    private readonly feedbackText: Konva.Text;
    private readonly workshopTitle: Konva.Text;
    private readonly workshopEmoji: Konva.Text;
    private readonly startButton: Konva.Group;
    private readonly submitButton: Konva.Group;
    private readonly nextButton: Konva.Group;

    private readonly completeEmoji: Konva.Text;
    private readonly completeSolvedText: Konva.Text;
    private readonly statBox: Konva.Rect;
    private readonly statLabel: Konva.Text;
    private readonly statValue: Konva.Text;
    private readonly statStatusText: Konva.Text;
    private readonly messageBox: Konva.Rect;
    private readonly messageText: Konva.Text;

    private readonly backButton: Konva.Group;
    private readonly leaveButton: Konva.Group;
    private readonly exitButton: Konva.Group;

    private answerBuffer = "";
    private lastPhase: UpgradePhase | null = null;
    private lastAwaitingNext = false;
    
    //Builds the header, footer, and all three middle panels once; render() only shows, hides, and updates them
    constructor(private readonly handlers: UpgradeMinigameViewHandlers) {
        this.group = new Konva.Group({ visible: false });
        
        this.group.add(new Konva.Rect({
            x: 0,
            y: 0,
            width:
            STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: BG
        }));
        
        this.healthBar = this.buildHeader();

        this.group.add(new Konva.Rect({
            x: 0, 
            y: FOOTER_Y, 
            width: STAGE_WIDTH, 
            height: STAGE_HEIGHT - FOOTER_Y, 
            fill: DARK
        }));
        
        this.backButton = this.createButton("Back", 60, 800, 200, 70, YELLOW, "#000000", () => this.handlers.onBack());
        this.leaveButton = this.createButton("Leave", STAGE_WIDTH - 260, 800, 200, 70, RED, "#FFFFFF", () => this.handlers.onLeave());
        this.exitButton = this.createButton("Exit", STAGE_WIDTH - 260, 800, 200, 70, RED, "#FFFFFF", () => this.handlers.onLeave());
        this.group.add(this.backButton, this.leaveButton, this.exitButton);

        this.choosePanel = new Konva.Group();
        this.buildChoosePanel();

        this.workshopPanel = new Konva.Group();
        this.workshopPanel.add(this.createPanelBackground());
        this.workshopPanel.add(new Konva.Rect({
            x: BOX_X,
            y: BOX_Y,
            width: BOX_W,
            height: BOX_H,
            fill: LAVENDER,
            stroke: PURPLE,
            strokeWidth: 4,
            cornerRadius: 10
        }));

        this.timerText = new Konva.Text({
            x: BOX_X + 30,
            y: BOX_Y + 25,
            text: "",
            fontSize: 40,
            fontFamily: MONO,
            fontStyle: "bold",
            fill: DARK
        });

        this.solvedText = new Konva.Text({
            x: BOX_X + BOX_W - 330,
            y: BOX_Y + 30, 
            width: 300,
            align: "right",
            text: "",
            fontSize: 30,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: "#4B2C83"
        });

        this.problemText = new Konva.Text({
            x: BOX_X,
            y: BOX_Y + 110,
            width: BOX_W,
            align: "center",
            text: "",
            fontSize: 72,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.instructionsText = new Konva.Text({
            x: BOX_X + 40,
            y: BOX_Y + 120,
            width: BOX_W - 80,
            align: "center",
            lineHeight: 1.3,
            text: "Solve as many problems as you can in 1 minute!\n\nType your answer and press Enter.\nRight or wrong, you move on to the next one.",
            fontSize: 32,
            fontFamily: FONT,
            fill: DARK
        });

        this.answerGroup = new Konva.Group();
        this.answerGroup.add(new Konva.Rect({
            x: BOX_X + 230, 
            y: BOX_Y + 220, 
            width: 300, 
            height: 80,
            fill: "#FFFFFF", 
            stroke: PURPLE, 
            strokeWidth: 3, 
            cornerRadius: 8
        }));
        
        this.answerText = new Konva.Text({
            x: BOX_X + 230, 
            y: BOX_Y + 220, 
            width: 300, 
            height: 80, 
            align: "center", 
            verticalAlign: "middle",
            text: "_", 
            fontSize: 48, 
            fontFamily: MONO, 
            fontStyle: "bold", 
            fill: DARK
        });
        
        this.answerGroup.add(this.answerText);
        this.submitButton = this.createButton("Submit", BOX_X + 280, BOX_Y + 325, 200, 60, BLUE, "#FFFFFF", () => this.submitAnswer());
        this.nextButton = this.createButton("Next", BOX_X + 280, BOX_Y + 325, 200, 60, ORANGE, "#FFFFFF", () => this.handlers.onNext());
        this.answerGroup.add(this.submitButton, this.nextButton);

        this.feedbackText = new Konva.Text({
            x: BOX_X,
            y: BOX_Y + 420,
            width: BOX_W,
            align: "center",
            text: "",
            fontSize: 30,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.workshopTitle = new Konva.Text({
            x: RIGHT_X,
            y: BOX_Y + 30,
            width: RIGHT_W,
            align: "center",
            text: "",
            fontSize: 46,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.workshopEmoji = new Konva.Text({
            x: RIGHT_X,
            y: BOX_Y + 130,
            width: RIGHT_W,
            align: "center",
            text: "",
            fontSize: 140
        });

        this.startButton = this.createButton("Start", RIGHT_X + (RIGHT_W - 220) / 2, BOX_Y + 390, 220, 70, GREEN, "#000000", () => this.handlers.onStart());

        this.workshopPanel.add(this.timerText, this.solvedText, this.problemText, this.instructionsText, this.answerGroup, this.feedbackText, this.workshopTitle, this.workshopEmoji, this.startButton);

        this.completePanel = new Konva.Group();
        this.completePanel.add(this.createPanelBackground());
        this.completePanel.add(new Konva.Text({
            x: PANEL_X,
            y: PANEL_Y + 30,
            width: PANEL_W,
            align: "center",
            text: "Upgrade Complete!",
            fontSize: 56,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        }));

        this.completeEmoji = new Konva.Text({
            x: PANEL_X,
            y: PANEL_Y + 150,
            width: 560,
            align: "center",
            text: "",
            fontSize: 200
        });

        const statCenterX = 1090;
        this.completeSolvedText = new Konva.Text({
            x: statCenterX - 300,
            y: PANEL_Y + 140,
            width: 600,
            align: "center",
            text: "",
            fontSize: 32,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.statBox = new Konva.Rect({
            x: statCenterX - 290,
            y: PANEL_Y + 210,
            width: 580,
            height: 110,
            fill: "#E8C98F",
            stroke: "#B8955A",
            strokeWidth: 3,
            cornerRadius: 8
        });

        this.statLabel = new Konva.Text({
            y: PANEL_Y + 210,
            height: 110,
            verticalAlign: "middle",
            text: "",
            fontSize: 44,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.statValue = new Konva.Text({
            y: PANEL_Y + 210,
            height: 110,
            verticalAlign: "middle",
            text: "",
            fontSize: 44,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: ORANGE
        });

        this.statStatusText = new Konva.Text({
            x: statCenterX - 290,
            y: PANEL_Y + 210,
            width: 580,
            height: 110,
            align: "center",
            verticalAlign: "middle",
            text: "",
            fontSize: 32,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.messageBox = new Konva.Rect({
            x: statCenterX - 230,
            y: PANEL_Y + 360,
            width: 460,
            height: 80,
            fill: "#C9F2CF",
            stroke: GREEN,
            strokeWidth: 3,
            cornerRadius: 8
        });

        this.messageText = new Konva.Text({
            x: statCenterX - 230,
            y: PANEL_Y + 360,
            width: 460,
            height: 80,
            align: "center",
            verticalAlign: "middle",
            text: "",
            fontSize: 24,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.completePanel.add(this.completeEmoji, this.completeSolvedText, this.statBox, this.statLabel,this.statValue, this.statStatusText, this.messageBox, this.messageText);

        this.group.add(this.choosePanel, this.workshopPanel, this.completePanel);
    }

    //Shows the panel and footer buttons for the current phase and fills in the latest values
    render(state: UpgradeMinigameState): void {
        const { phase } = state;
        if (phase !== this.lastPhase) {
            this.answerBuffer = "";
            this.lastPhase = phase;
            this.resetHover();
        }

        this.updateHealthBar(state.playerHp, state.playerMaxHp);

        this.choosePanel.visible(phase === "choose");
        this.workshopPanel.visible(phase === "ready" || phase === "solving");
        this.completePanel.visible(phase === "complete");

        this.backButton.visible(phase === "choose" || phase === "ready");
        this.leaveButton.visible(phase !== "complete");
        this.exitButton.visible(phase === "complete");

        if (phase === "ready" || phase === "solving") {
            this.renderWorkshop(state, phase === "solving");
        } else if (phase === "complete") {
            this.renderComplete(state);
        }

        this.group.getLayer()?.batchDraw();
    }

    //Returns the Konva group that holds the whole screen
    getGroup(): Konva.Group {
        return this.group;
    }

    //Makes the screen visible and starts listening for typed answers
    show(): void {
        this.group.visible(true);
        window.addEventListener("keydown", this.handleKeyDown);
        this.group.getLayer()?.batchDraw();
    }

    //Stops listening for typed answers, clears hover effects, and hides the screen
    hide(): void {
        window.removeEventListener("keydown", this.handleKeyDown);
        this.resetHover();
        this.group.visible(false);
        this.group.getLayer()?.batchDraw();
    }

    //Updates the ready and solving phases: instructions and Start before the round, then the timer, problem, answer, and Submit/Next during it
    private renderWorkshop(state: UpgradeMinigameState, solving: boolean): void {
        if (state.upgradeType !== null) {
            const info = UPGRADE_INFO[state.upgradeType];
            this.workshopTitle.text(`Upgrade ${info.label}`);
            this.workshopEmoji.text(info.emoji);
        }

        this.instructionsText.visible(!solving);
        this.startButton.visible(!solving);
        this.timerText.visible(solving);
        this.solvedText.visible(solving);
        this.problemText.visible(solving);
        this.answerGroup.visible(solving);
        this.feedbackText.visible(solving);

        if (!solving) {
            return;
        }

        this.timerText.text(`⏱ ${this.formatTime(state.timeLeft)}`);
        this.timerText.fill(state.timeLeft <= 10 ? "#D7263D" : DARK);
        this.solvedText.text(`Solved: ${state.correctCount}`);
        this.problemText.text(state.problemText);
        this.updateAnswerText();
        this.submitButton.visible(!state.awaitingNext);
        this.nextButton.visible(state.awaitingNext);
        
        if (state.awaitingNext !== this.lastAwaitingNext) {
            this.lastAwaitingNext = state.awaitingNext;
            this.resetHover();
        }

        if (state.feedback === null) {
            this.feedbackText.text("");
        } else {            
            const message = FEEDBACK_TEXT[state.feedback].text;
            this.feedbackText.text(state.feedback === "incorrect" ? `${message} ${state.revealedAnswer}` : message);
            this.feedbackText.fill(FEEDBACK_TEXT[state.feedback].color);
        }
    }

    //Updates the complete phase: the score, then the stat change, a loading message, or an error
    private renderComplete(state: UpgradeMinigameState): void {
        if (state.upgradeType === null) {
            return;
        }
        const info = UPGRADE_INFO[state.upgradeType];

        this.completeEmoji.text(info.emoji);
        this.completeSolvedText.text(`You solved ${state.correctCount} of ${state.attemptedCount}!`);

        if (state.resultMessage) {
            this.statLabel.visible(false);
            this.statValue.visible(false);
            this.statStatusText.visible(true);
            this.statStatusText.text(state.resultMessage);
            const earned = state.outcomeStatus === "ready";
            this.messageBox.visible(earned);
            this.messageText.visible(earned);
            this.messageText.text("Your gear has been upgraded!");
            return;
        }

        const ready = state.outcomeStatus === "ready";
        this.statLabel.visible(ready);
        this.statValue.visible(ready);
        this.messageBox.visible(ready);
        this.messageText.visible(ready);
        this.statStatusText.visible(!ready);

        if (ready) {
            this.statLabel.text(info.stat);
            this.statValue.text(`${state.statBefore} → ${state.statAfter}`);
            const gap = 16;
            const total = this.statLabel.width() + gap + this.statValue.width();
            const left = this.statBox.x() + (this.statBox.width() - total) / 2;
            this.statLabel.x(left);
            this.statValue.x(left + this.statLabel.width() + gap);
            this.messageText.text(`Your ${info.label.toLowerCase()} has been upgraded!`);
        } else if (state.outcomeStatus === "loading") {
            this.statStatusText.text("Applying upgrade...");
        } else {
            this.statStatusText.text("Couldn't apply the upgrade.");
        }
    }

    //Builds the top bar (HP bar, title, score, and floor) and returns the health bar so it can be resized later
    private buildHeader(): Konva.Rect {
        this.group.add(new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: HEADER_HEIGHT,
            fill: "#180221",
            stroke: "#410559"
        }));

        this.group.add(new Konva.Text({
            x: 25,
            y: 35,
            text: "HP",
            fontSize: 40,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: HP_GREEN
        }));


        this.group.add(new Konva.Rect({
            x: HP_BAR_X,
            y: HP_BAR_Y, 
            width: HP_BAR_W, 
            height: HP_BAR_H, 
            fill: "#c4c4c4", 
            stroke: "#42a847"
        }));

        const healthBar = new Konva.Rect({
            x: HP_BAR_X, 
            y: HP_BAR_Y, 
            width: HP_BAR_W, 
            height: HP_BAR_H, 
            fill: HP_GREEN, 
            stroke: "#42a847"
        });
        
        this.group.add(healthBar);

        this.group.add(new Konva.Text({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: HEADER_HEIGHT,
            align: "center",
            verticalAlign: "middle",
            text: "UPGRADE WORKSHOP",
            fontSize: 44,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: "#FFFFFF"
        }));

        this.group.add(new Konva.Rect({
            x: 1250, 
            y: 37, 
            width: 25, 
            height: 25, 
            cornerRadius: 5, 
            rotation: 45,
            fill: SCORE_ORANGE, 
            stroke: "#cc721d"
        }));

        this.group.add(new Konva.Text({
            x: 1280,
            y: 35,
            text: "Score",
            fontSize: 40,
            fontFamily: FONT,
            fill: SCORE_ORANGE
        }));

        this.group.add(new Konva.Text({
            x: STAGE_WIDTH - 260,
            y: 0,
            width: 200,
            height: HEADER_HEIGHT,
            align: "right",
            verticalAlign: "middle",
            text: "Floor X", 
            fontSize: 32,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: "#F5E6C8"
        }));

        return healthBar;
    }
    
    //Builds the choose phase: the heading and one card per upgrade with its emoji, stat, and Choose button
    private buildChoosePanel(): void {
        this.choosePanel.add(new Konva.Text({
            x: 0,
            y: 150,
            width: STAGE_WIDTH,
            align: "center",
            text: "Choose an upgrade to work on",
            fontSize: 36,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: "#FFFFFF"
        }));

        const cardW = 300;
        const cardH = 400;
        const gap = 120;
        const startX = (STAGE_WIDTH - (UPGRADE_TYPES.length * cardW + (UPGRADE_TYPES.length - 1) * gap)) / 2;
        const cardY = 230;

        UPGRADE_TYPES.forEach((type, i) => {
            const info = UPGRADE_INFO[type];
            const x = startX + i * (cardW + gap);

            this.choosePanel.add(new Konva.Rect({
                x,
                y: cardY,
                width: cardW,
                height: cardH,
                fill: CREAM,
                stroke: CREAM_BORDER,
                strokeWidth: 4,
                cornerRadius: 8
            }));

            this.choosePanel.add(new Konva.Text({
                x,
                y: cardY + 30,
                width: cardW, 
                align: "center",
                text: info.label, 
                fontSize: 36, 
                fontFamily: FONT, 
                fontStyle: "bold", 
                fill: DARK
            }));

            this.choosePanel.add(new Konva.Text({
                x, 
                y: cardY + 95, 
                width: cardW,
                align: "center", 
                text: info.emoji,
                fontSize: 110
            }));

            this.choosePanel.add(new Konva.Text({
                x,
                y: cardY + 250,
                width: cardW,
                align: "center",
                text: `+${info.stat}`,
                fontSize: 30,
                fontFamily: FONT,
                fontStyle: "bold",
                fill: DARK
            }));

            this.choosePanel.add(this.createButton("Choose", x + 40, cardY + 315, cardW - 80, 60, RED, "#FFFFFF", () => this.handlers.onChoose(type)));
        });
    }

    //Creates the cream panel background shared by the ready, solving, and complete phases
    private createPanelBackground(): Konva.Rect {
        return new Konva.Rect({
            x: PANEL_X,
            y: PANEL_Y,
            width: PANEL_W,
            height: PANEL_H,
            fill: CREAM, 
            stroke: CREAM_BORDER, 
            strokeWidth: 4, 
            cornerRadius: 8
        });
    }

    //Handles typing during a round: digits and Backspace edit the answer, and Enter submits it or moves to the next problem
    private readonly handleKeyDown = (event: KeyboardEvent): void => {
        if (this.lastPhase !== "solving") {
            return;
        }

        if (this.lastAwaitingNext) {
            if (event.key !== "Enter") {
                return;
            }
            this.handlers.onNext();
        } else if (/^[0-9]$/.test(event.key)) {
            if (this.answerBuffer.length < MAX_ANSWER_LENGTH) {
                this.answerBuffer += event.key;
            }
        } else if (event.key === "Backspace") {
            this.answerBuffer = this.answerBuffer.slice(0, -1);
        } else if (event.key === "Enter") {
            this.submitAnswer();
        } else {
            return;
        }

        event.preventDefault();
        this.updateAnswerText();
        this.group.getLayer()?.batchDraw();
    };

    //Clears the typed answer and sends it to the controller
    private submitAnswer(): void {
        const answer = this.answerBuffer;
        this.answerBuffer = "";
        this.updateAnswerText();
        this.handlers.onSubmit(answer);
    }

    //Shows what the player has typed so far, or "_" when empty
    private updateAnswerText(): void {
        this.answerText.text(this.answerBuffer === "" ? "_" : this.answerBuffer);
    }

    //Formats seconds as m:ss (Eg. 45 -> 0:45)
    private formatTime(seconds: number): string {
        const s = Math.max(0, seconds);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    }

    //Resizes the green HP bar to match the player's current health
    private updateHealthBar(hp: number, maxHp: number): void {
        const fraction = maxHp > 0 ? Math.max(0, Math.min(hp / maxHp, 1)) : 0;
        this.healthBar.width(HP_BAR_W * fraction);
    }

    //Puts the cursor and every button color back to normal (used when a button hides while the mouse is over it)
    private resetHover(): void {
        document.body.style.cursor = "default";
        this.buttonBgs.forEach((bg) => bg.fill(bg.getAttr("baseFill")));
    }

    //Creates a clickable button that changes color and shows a pointer cursor on hover
    private createButton(label: string, x: number, y: number, width: number, height: number, fill: string, textColor: string, onClick: () => void): Konva.Group {
        const button = new Konva.Group({ x, y });
        const bg = new Konva.Rect({
            width,
            height, 
            fill, 
            cornerRadius: 6, 
            stroke: "#FFE9C2", 
            strokeWidth: 2
        });
        
        bg.setAttr("baseFill", fill);
        this.buttonBgs.push(bg);

        const text = new Konva.Text({
            width,
            height,
            align: "center",
            verticalAlign: "middle",
            text: label, 
            fontSize: 26, 
            fontFamily: FONT, 
            fontStyle: "bold", 
            fill: textColor
        });

        button.add(bg, text);
        button.on("click tap", onClick);
        
        button.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
            bg.fill(HOVER);
        });

        button.on("mouseleave", () => {
            document.body.style.cursor = "default";
            bg.fill(fill);
        });
        
        return button;
    }
}
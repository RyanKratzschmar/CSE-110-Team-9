import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";
import { UPGRADE_INFO } from "./UpgradeMinigameScreenModel.ts";
import type { UpgradeMinigameState, UpgradePhase, UpgradeType } from "./UpgradeMinigameScreenModel.ts";

//Functions the view calls when the player clicks a button or presses a key
export interface UpgradeMinigameViewHandlers {
    onStart(): void;
    onSubmit(answer: string): void;
    onNext(): void;
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

    private readonly workshopPanel: Konva.Group;
    private readonly completePanel: Konva.Group;

    private readonly healthBar: Konva.Rect;
    private floorText: Konva.Text;

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

    private readonly completeTitleText: Konva.Text;
    private readonly completeSolvedText: Konva.Text;
    private readonly statRows: Konva.Group;
    private readonly statValues = {} as Record<UpgradeType, Konva.Text>;
    private readonly statStatusText: Konva.Text;
    private readonly messageBox: Konva.Rect;
    private readonly messageText: Konva.Text;

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

        this.floorText = new Konva.Text({
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
        });
        this.group.add(this.floorText);
        
        this.leaveButton = this.createButton("Leave", STAGE_WIDTH - 260, 800, 200, 70, RED, "#FFFFFF", () => this.handlers.onLeave());
        this.exitButton = this.createButton("Exit", STAGE_WIDTH - 260, 800, 200, 70, RED, "#FFFFFF", () => this.handlers.onLeave());
        this.group.add(this.leaveButton, this.exitButton);

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
            text: "Solve as many problems as you can in 1 minute!\n\nType your answer and press Enter.\nAnswer at least 10 problems correctly to receive upgrades to your weapon, armor, and potion!",
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
            text: "Upgrade Gear",
            fontSize: 46,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.workshopEmoji = new Konva.Text({
            x: RIGHT_X,
            y: BOX_Y + 150,
            width: RIGHT_W,
            align: "center",
            text: UPGRADE_TYPES.map((type) => UPGRADE_INFO[type].emoji).join(" "),
            fontSize: 100
        });

        this.startButton = this.createButton("Start", RIGHT_X + (RIGHT_W - 220) / 2, BOX_Y + 390, 220, 70, GREEN, "#000000", () => this.handlers.onStart());

        this.workshopPanel.add(this.timerText, this.solvedText, this.problemText, this.instructionsText, this.answerGroup, this.feedbackText, this.workshopTitle, this.workshopEmoji, this.startButton);

        this.completePanel = new Konva.Group();
        this.completePanel.add(this.createPanelBackground());
        this.completeTitleText = new Konva.Text({
            x: PANEL_X,
            y: PANEL_Y + 30,
            width: PANEL_W,
            align: "center",
            text: "Upgrade Complete!",
            fontSize: 56,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });
        this.completePanel.add(this.completeTitleText);

        this.completeSolvedText = new Konva.Text({
            x: PANEL_X,
            y: PANEL_Y + 110,
            width: PANEL_W,
            align: "center",
            text: "",
            fontSize: 32,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.statRows = this.buildStatRows();

        this.statStatusText = new Konva.Text({
            x: PANEL_X,
            y: PANEL_Y + 170,
            width: PANEL_W,
            height: 270,
            align: "center",
            verticalAlign: "middle",
            text: "",
            fontSize: 32,
            fontFamily: FONT,
            fontStyle: "bold",
            fill: DARK
        });

        this.messageBox = new Konva.Rect({
            x: PANEL_X + (PANEL_W - 460) / 2,
            y: PANEL_Y + 460,
            width: 460,
            height: 80,
            fill: "#C9F2CF",
            stroke: GREEN,
            strokeWidth: 3,
            cornerRadius: 8
        });

        this.messageText = new Konva.Text({
            x: PANEL_X + (PANEL_W - 460) / 2,
            y: PANEL_Y + 460,
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

        this.completePanel.add(this.completeSolvedText, this.statRows, this.statStatusText, this.messageBox, this.messageText);

        this.group.add(this.workshopPanel, this.completePanel);
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

        this.workshopPanel.visible(phase === "ready" || phase === "solving");
        this.completePanel.visible(phase === "complete");

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

    //Updates the complete phase: the score, then the weapon, armor, and potion changes, a loading message, or an error
    private renderComplete(state: UpgradeMinigameState): void {
        this.completeSolvedText.text(`You solved ${state.correctCount} of ${state.attemptedCount}!`);
        this.completeTitleText.visible(!state.resultMessage);
        this.completeSolvedText.visible(!state.resultMessage);

        if (state.resultMessage) {
            this.statRows.visible(false);
            this.messageBox.visible(false);
            this.messageText.visible(false);
            this.statStatusText.visible(true);
            this.statStatusText.text(state.resultMessage);
            return;
        }

        const outcome = state.outcome;
        const ready = state.outcomeStatus === "ready" && outcome !== null;
        this.statRows.visible(ready);
        this.messageBox.visible(ready);
        this.messageText.visible(ready);
        this.statStatusText.visible(!ready);

        if (ready) {
            for (const type of UPGRADE_TYPES) {
                const { statBefore, statAfter } = outcome[type];
                const format = (n: number) => (type === "armor" ? n.toFixed(2) : String(n));
                this.statValues[type].text(`${format(statBefore)} → ${format(statAfter)}  (+${format(statAfter - statBefore)})`);
            }
            this.messageText.text("Your gear has been upgraded!");
        } else if (state.outcomeStatus === "loading") {
            this.statStatusText.text("Applying upgrades...");
        } else {
            this.statStatusText.text("Couldn't apply the upgrades.");
        }
    }

    //Builds one row per upgrade type (emoji, name, and stat on the left, the change on the right) and saves each value text so it can be filled in later
    private buildStatRows(): Konva.Group {
        const rows = new Konva.Group();
        const rowW = 900;
        const rowH = 80;
        const rowGap = 15;
        const rowX = PANEL_X + (PANEL_W - rowW) / 2;

        UPGRADE_TYPES.forEach((type, i) => {
            const info = UPGRADE_INFO[type];
            const y = PANEL_Y + 170 + i * (rowH + rowGap);

            rows.add(new Konva.Rect({
                x: rowX,
                y,
                width: rowW,
                height: rowH,
                fill: "#E8C98F",
                stroke: "#B8955A",
                strokeWidth: 3,
                cornerRadius: 8
            }));

            rows.add(new Konva.Text({
                x: rowX + 30,
                y,
                height: rowH,
                verticalAlign: "middle",
                text: `${info.emoji}  ${info.label} (${info.stat})`,
                fontSize: 34,
                fontFamily: FONT,
                fontStyle: "bold",
                fill: DARK
            }));

            const value = new Konva.Text({
                x: rowX,
                y,
                width: rowW - 30,
                height: rowH,
                align: "right",
                verticalAlign: "middle",
                text: "",
                fontSize: 34,
                fontFamily: FONT,
                fontStyle: "bold",
                fill: ORANGE
            });

            this.statValues[type] = value;
            rows.add(value);
        });

        return rows;
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

        /*
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
        */

        return healthBar;
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

    // Updates floor text to the correct number
    setFloorNum(floor: number){
        this.floorText.text(`Floor: ${floor}`);
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
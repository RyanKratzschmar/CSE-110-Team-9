import Konva from "konva";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";
import type { View } from "./types.ts";

export class EndGameConfirmationView implements View {
    private readonly group = new Konva.Group({ name: "end-game-confirmation", visible: false });

    constructor(onConfirm: () => void) {
        this.group.add(new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#433550",
        }));
        this.group.add(new Konva.Text({
            y: 300,
            width: STAGE_WIDTH,
            text: "Do you want to exit the game?",
            align: "center",
            fontSize: 48,
            fontFamily: "Arial",
            fontStyle: "bold",
            fill: "white",
        }));

        for (const [index, label] of ["Confirm", "Cancel"].entries()) {
            const button = new Konva.Group({
                name: label === "Confirm" ? "confirm-end-game" : "cancel-end-game",
                x: 540 + index * 280,
                y: 450,
            });
            button.add(new Konva.Rect({
                width: 240,
                height: 75,
                cornerRadius: 10,
                fill: label === "Confirm" ? "#F04A23" : "#FFC943",
            }));
            button.add(new Konva.Text({
                text: label,
                width: 240,
                height: 75,
                align: "center",
                verticalAlign: "middle",
                fontSize: 32,
                fontFamily: "Arial",
                fontStyle: "bold",
                fill: label === "Confirm" ? "white" : "#180221",
                listening: false,
            }));
            button.on("click tap", () => {
                if (!this.group.isVisible()) return;
                this.hide();
                if (label === "Confirm") onConfirm();
            });
            button.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
            button.on("mouseleave", () => { document.body.style.cursor = "default"; });
            this.group.add(button);
        }
    }

    getGroup(): Konva.Group {
        return this.group;
    }

    show(): void {
        document.body.style.cursor = "default";
        this.group.show();
        this.group.getLayer()?.moveToTop();
        this.group.getLayer()?.batchDraw();
        window.addEventListener("keydown", this.blockGameplayInput, true);
    }

    hide(): void {
        document.body.style.cursor = "default";
        this.group.hide();
        this.group.getLayer()?.batchDraw();
        window.removeEventListener("keydown", this.blockGameplayInput, true);
    }

    private readonly blockGameplayInput = (event: KeyboardEvent): void => {
        event.preventDefault();
        event.stopImmediatePropagation();
    };
}

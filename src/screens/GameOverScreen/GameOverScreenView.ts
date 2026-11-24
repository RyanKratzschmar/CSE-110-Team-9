import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";

export class GameOverScreenView implements View {
    private readonly group = new Konva.Group({ visible: false });

    constructor(onPlayAgain: () => void) {
        this.group.add(new Konva.Rect({
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#433550",
        }));
        this.group.add(new Konva.Text({
            y: 230,
            width: STAGE_WIDTH,
            text: "Game Over",
            align: "center",
            fontSize: 100,
            fontFamily: "Arial",
            fontStyle: "bold",
            fill: "#FF9E42",
        }));
        this.group.add(new Konva.Text({
            y: 370,
            width: STAGE_WIDTH,
            text: "Your run has ended.",
            align: "center",
            fontSize: 32,
            fontFamily: "Arial",
            fill: "white",
        }));

        const button = new Konva.Group({
            name: "play-again",
            x: (STAGE_WIDTH - 360) / 2,
            y: 480,
        });
        button.add(new Konva.Rect({
            width: 360,
            height: 85,
            cornerRadius: 12,
            fill: "#FFC943",
        }));
        button.add(new Konva.Text({
            text: "Play Again",
            width: 360,
            height: 85,
            align: "center",
            verticalAlign: "middle",
            fontSize: 36,
            fontFamily: "Arial",
            fontStyle: "bold",
            fill: "#180221",
            listening: false,
        }));
        button.on("click tap", onPlayAgain);
        button.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
        button.on("mouseleave", () => { document.body.style.cursor = "default"; });
        this.group.add(button);
    }

    getGroup(): Konva.Group {
        return this.group;
    }

    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.batchDraw();
    }

    hide(): void {
        document.body.style.cursor = "default";
        this.group.visible(false);
        this.group.getLayer()?.batchDraw();
    }
}

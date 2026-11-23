import Konva from "konva";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./constants.ts";

// One shared control for all non-title screens; navigation owns ending the run.
export function createEndGameButton(onEndGame: () => void): Konva.Group {
    const button = new Konva.Group({
        name: "end-game-button",
        x: STAGE_WIDTH - 580,
        y: STAGE_HEIGHT - 90,
        visible: false,
    });
    button.add(new Konva.Rect({
        width: 220,
        height: 70,
        cornerRadius: 10,
        fill: "#F04A23",
    }));
    button.add(new Konva.Text({
        text: "End Game",
        width: 220,
        height: 70,
        align: "center",
        verticalAlign: "middle",
        fontSize: 30,
        fontFamily: "Arial",
        fontStyle: "bold",
        fill: "white",
        listening: false,
    }));
    button.on("click tap", () => {
        if (button.isVisible()) onEndGame();
    });
    button.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
    button.on("mouseleave", () => { document.body.style.cursor = "default"; });
    return button;
}

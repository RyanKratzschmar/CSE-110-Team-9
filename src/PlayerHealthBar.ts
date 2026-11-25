import Konva from "konva";

// Create a percentage label in the center of the HP bar.
export function createHealthPercentage(
    bar: Konva.Rect,
    fullWidth: number
): Konva.Text {
    return new Konva.Text({
        x: bar.x(),
        y: bar.y(),
        width: fullWidth,
        height: bar.height(),
        text: "100%",
        align: "center",
        verticalAlign: "middle",
        fontFamily: "Arial",
        fontSize: bar.height() === 30 ? 25 : 30,
        fontStyle: "bold",
        fill: "white",
        stroke: "#333333",
        strokeWidth: 0.5,
        listening: false,
    });
}

// Update the player's HP bar and percentage.
export function updatePlayerHealthBar(
    bar: Konva.Rect,
    label: Konva.Text,
    currentHp: number,
    maxHp: number
): void {
    const fraction = maxHp > 0
        ? Math.max(0, Math.min(currentHp / maxHp, 1))
        : 0;

    bar.width(label.width() * fraction);
    label.text(`${Math.round(fraction * 100)}%`);
}
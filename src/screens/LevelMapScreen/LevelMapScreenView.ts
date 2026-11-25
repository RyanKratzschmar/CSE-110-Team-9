import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";

interface NodeConfig {
    title: string;
    icon: string;
    bg: string;
    x: number;
    y: number;
}

const NODES: NodeConfig[] = [
    { title: "Fight 1", icon: "/icon_swords.png", bg: "#3D2B52", x: 140, y: 465 },
    { title: "Fight 2", icon: "/icon_swords.png", bg: "#3D2B52", x: 420, y: 235 },
    { title: "Fight 3", icon: "/icon_swords.png", bg: "#3D2B52", x: 710, y: 345 },
    { title: "Rest", icon: "/icon_campfire.png", bg: "#2B4842", x: 1000, y: 235 },
    { title: "Next Floor", icon: "/icon_stairs.png", bg: "#3D2B52", x: 1280, y: 465 },
];

export class LevelMapScreenView implements View {
    private group: Konva.Group;
    private healthBar: Konva.Rect;
    private floorText: Konva.Text;

    private cardBorders: Konva.Rect[] = [];
    private cardGroups: Konva.Group[] = [];
    private cardSparkles: Konva.Group[] = [];
    private arrowIndicator: Konva.Line;

    private readonly cardWidth = 160;
    private readonly cardHeight = 200;

    constructor(onGoClick: () => void) {
        this.group = new Konva.Group({ visible: false });

        // Background
        const bg = new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            fill: "#EEE4C8",
        });
        this.group.add(bg);

        // Top HUD Bar
        const upperRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: STAGE_WIDTH,
            height: 150,
            fill: "#180221",
            stroke: "#410559",
        });
        this.group.add(upperRect);

        // Background for health bar when health is missing
        const healthBarBG = new Konva.Rect({
            x: 100,
            y: 35,
            width: 400,
            height: 70,
            fill: "#c4c4c4ff",
            stroke: "#42a847",
        });
        this.group.add(healthBarBG);

        // Player Health Bar
        this.healthBar = new Konva.Rect({
            x: 100,
            y: 35,
            width: 300,
            height: 70,
            fill: "#0bba14",
            stroke: "#42a847",
        });
        this.group.add(this.healthBar);

        // "HP" text next to the health bar
        const hpText = new Konva.Text({
            x: 25,
            y: 50,
            text: "HP",
            fontSize: 40,
            fontFamily: "Arial",
            fontStyle: "bold",
            fill: "#0bba14",
        });
        this.group.add(hpText);

        // Score Text
        const scoreText = new Konva.Text({
            x: 600,
            y: 50,
            fontSize: 40,
            text: "Score",
            fill: "#FF9E42",
            fontFamily: "Arial",
        });
        this.group.add(scoreText);

        // Diamond shape next to score
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

        // Settings Button
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

        // Floor Text
        this.floorText = new Konva.Text({
            x: 1200,
            y: 50,
            text: "Floor: X",
            fill: "white",
            fontSize: 40,
            fontFamily: "Arial",
            fontStyle: "bold",
        });
        this.group.add(this.floorText);

        // Connecting Trail Path
        const trailLine = new Konva.Line({
            points: [
                NODES[0].x + this.cardWidth / 2, NODES[0].y + this.cardHeight / 2,
                NODES[1].x + this.cardWidth / 2, NODES[1].y + this.cardHeight / 2,
                NODES[2].x + this.cardWidth / 2, NODES[2].y + this.cardHeight / 2,
                NODES[3].x + this.cardWidth / 2, NODES[3].y + this.cardHeight / 2,
                NODES[4].x + this.cardWidth / 2, NODES[4].y + this.cardHeight / 2,
            ],
            stroke: "#B8AB88",
            strokeWidth: 4,
            dash: [12, 10],
            lineCap: "round",
            lineJoin: "round",
        });
        this.group.add(trailLine);

        // Staggered Cards
        NODES.forEach((node) => {
            const cardGroup = new Konva.Group({
                x: node.x,
                y: node.y,
            });

            // Card background & border
            const cardBorder = new Konva.Rect({
                width: this.cardWidth,
                height: this.cardHeight,
                cornerRadius: 18,
                fill: node.bg,
                stroke: "#5C4F72",
                strokeWidth: 5,
            });
            cardGroup.add(cardBorder);
            this.cardBorders.push(cardBorder);

            // Sparkles for active card
            const sparkles = new Konva.Group({ visible: false });
            sparkles.add(new Konva.Line({
                points: [16, 10, 19, 15, 24, 17, 19, 19, 16, 24, 13, 19, 8, 17, 13, 15],
                closed: true,
                fill: "#F6C12C",
            }));
            sparkles.add(new Konva.Line({
                points: [142, 12, 144, 16, 149, 18, 144, 20, 142, 24, 140, 20, 135, 18, 140, 16],
                closed: true,
                fill: "#F6C12C",
            }));
            cardGroup.add(sparkles);
            this.cardSparkles.push(sparkles);

            // Icon Image
            const img = new Image();
            img.src = node.icon;
            const icon = new Konva.Image({
                x: (this.cardWidth - 85) / 2,
                y: 26,
                width: 85,
                height: 85,
                image: img,
                listening: false,
            });
            img.onload = () => {
                this.group.getLayer()?.batchDraw();
            };
            cardGroup.add(icon);

            // Bottom Pill Badge
            const pillRect = new Konva.Rect({
                x: 12,
                y: 138,
                width: this.cardWidth - 24,
                height: 44,
                cornerRadius: 10,
                fill: "#FFF8EC",
                stroke: "#22132C",
                strokeWidth: 2,
            });
            cardGroup.add(pillRect);

            const pillText = new Konva.Text({
                x: 12,
                y: 150,
                width: this.cardWidth - 24,
                align: "center",
                text: node.title,
                fontSize: 20,
                fontFamily: "Arial",
                fontStyle: "bold",
                fill: "#22132C",
                listening: false,
            });
            cardGroup.add(pillText);

            this.group.add(cardGroup);
            this.cardGroups.push(cardGroup);
        });

        // Downward Arrow Indicator
        this.arrowIndicator = new Konva.Line({
            points: [-16, -22, 16, -22, 0, 0],
            closed: true,
            fill: "#F6C12C",
            stroke: "#22132C",
            strokeWidth: 3,
            x: NODES[0].x + this.cardWidth / 2,
            y: NODES[0].y - 6,
        });
        this.group.add(this.arrowIndicator);

        // GO! Button
        const goButton = new Konva.Group({
            x: 700,
            y: 750,
        });

        const goRect = new Konva.Rect({
            width: 200,
            height: 90,
            fill: "#FFC943",
            stroke: "#dda71e",
            cornerRadius: 14,
        });
        goButton.add(goRect);

        const goButtonText = new Konva.Text({
            text: "GO!",
            width: 200,
            height: 90,
            align: "center",
            verticalAlign: "middle",
            fontSize: 38,
            fontStyle: "bold",
            fontFamily: "Arial",
            fill: "#22132C",
            listening: false,
        });
        goButton.add(goButtonText);

        goButton.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
            goRect.fill("#FFD970");
            this.group.getLayer()?.batchDraw();
        });

        goButton.on("mouseleave", () => {
            document.body.style.cursor = "default";
            goRect.fill("#FFC943");
            this.group.getLayer()?.batchDraw();
        });

        goButton.on("click tap", () => {
            onGoClick();
        });

        this.group.add(goButton);
    }

    // Lights up reached stops, moves arrow to current stop
    showProgress(floor: number, currentIndex: number): void {
        const clampedIndex = Math.max(0, Math.min(currentIndex, NODES.length - 1));

        // Position arrow indicator above current card
        const targetNode = NODES[clampedIndex];
        this.arrowIndicator.position({
            x: targetNode.x + this.cardWidth / 2,
            y: targetNode.y - 6,
        });
        this.arrowIndicator.visible(true);

        this.cardBorders.forEach((border, i) => {
            const sparkles = this.cardSparkles[i];
            const group = this.cardGroups[i];

            if (i === clampedIndex) {
                // Active Card: Gold border, sparkles, full opacity
                border.stroke("#F6C12C");
                border.strokeWidth(6);
                sparkles?.visible(true);
                group.opacity(1.0);
            } else if (i < clampedIndex) {
                // Completed Card: Dimmed
                border.stroke("#453757");
                border.strokeWidth(4);
                sparkles?.visible(false);
                group.opacity(0.65);
            } else {
                // Upcoming Card: Standard border
                border.stroke("#5C4F72");
                border.strokeWidth(4);
                sparkles?.visible(false);
                group.opacity(0.95);
            }
        });

        this.floorText.text(`Floor: ${floor}`);
        this.group.getLayer()?.batchDraw();
    }

    // Updates Player Health Bar
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

    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.draw();
    }

    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.draw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}

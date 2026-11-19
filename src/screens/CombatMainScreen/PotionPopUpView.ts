// PotionPopUpView: opened by the combat Potion button; shows your potions, click one to drink it, or Back to pick another action. (Arushi)
import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";
import type { Potion } from "../../../backend/game/Potion.ts";
import { HEAL_PERCENT } from "../../../backend/game/Potion.ts";

export class PotionPopUpView implements View {
    private group: Konva.Group;
    private healthBar: Konva.Rect;
    private potionListGroup: Konva.Group;
    private onDrinkPotion: (index: number) => void;
    private onBack: () => void;
    
    constructor(
        onDrinkPotion: (index: number) => void = () => {},
        onBack: () => void = () => {}
    ) {
        this.onDrinkPotion = onDrinkPotion;
        this.onBack = onBack;
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
        });
        this.group.add(hpText);

        // Button For Settings
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

        // Back button to return to action select
        const backButton = new Konva.Rect({
            x: 100,
            y: 775,
            width: 250,
            height: 100,
            fill: "#e53e3e",
            stroke: "#c53030",
            cornerRadius: 10,
        });
        backButton.on("mouseenter", () => {
            document.body.style.cursor = "pointer";
            backButton.fill("#f56565");
        });
        backButton.on("mouseleave", () => {
            document.body.style.cursor = "default";
            backButton.fill("#e53e3e");
        });
        backButton.on("click tap", () => {
            document.body.style.cursor = "default";
            this.onBack();
        });
        this.group.add(backButton);

        const backText = new Konva.Text({
            x: 100,
            y: 810,
            width: 250,
            align: "center",
            text: "BACK",
            fontSize: 36,
            fontFamily: "Arial",
            fontStyle: "bold",
            fill: "white",
            listening: false,
        });
        this.group.add(backText);

        // Group to hold potion entries
        this.potionListGroup = new Konva.Group({
            x: 100,
            y: 190,
        });
        this.group.add(this.potionListGroup);
    }

    setHandlers(onDrinkPotion: (index: number) => void, onBack: () => void): void {
        this.onDrinkPotion = onDrinkPotion;
        this.onBack = onBack;
    }

    updatePotions(potions: readonly Potion[], hp?: number, maxHp?: number): void {
        if (hp !== undefined && maxHp !== undefined && maxHp > 0) {
            const width = Math.min(400, Math.max(0, (hp / maxHp) * 400));
            this.healthBar.width(width);
        }

        this.potionListGroup.destroyChildren();

        if (potions.length === 0) {
            const emptyText = new Konva.Text({
                x: 0,
                y: 150,
                width: STAGE_WIDTH - 200,
                align: "center",
                text: "No potions in inventory",
                fontSize: 36,
                fontFamily: "Arial",
                fontStyle: "bold",
                fill: "#e2e8f0",
            });
            this.potionListGroup.add(emptyText);
            this.group.getLayer()?.batchDraw();
            return;
        }

        const maxDisplay = Math.min(potions.length, 4);
        const cardHeight = 100;
        const cardGap = 20;

        for (let i = 0; i < maxDisplay; i++) {
            const potion = potions[i];
            const yOffset = i * (cardHeight + cardGap);

            const card = new Konva.Rect({
                x: 0,
                y: yOffset,
                width: 1000,
                height: cardHeight,
                fill: "#2b1333",
                stroke: "#5c2b6d",
                strokeWidth: 2,
                cornerRadius: 10,
            });
            this.potionListGroup.add(card);

            const isAdv = potion.level === "advanced";
            const healVal = HEAL_PERCENT[potion.level] ?? (isAdv ? 30 : 20);
            const potionName = isAdv ? "Advanced Healing Potion" : "Basic Healing Potion";

            const nameText = new Konva.Text({
                x: 30,
                y: yOffset + 20,
                text: potionName,
                fontSize: 28,
                fontFamily: "Arial",
                fontStyle: "bold",
                fill: isAdv ? "#d8b4fe" : "#67e8f9",
            });
            this.potionListGroup.add(nameText);

            const descText = new Konva.Text({
                x: 30,
                y: yOffset + 60,
                text: `Heals ${healVal}% max HP`,
                fontSize: 20,
                fontFamily: "Arial",
                fill: "#cbd5e1",
            });
            this.potionListGroup.add(descText);

            const drinkBtn = new Konva.Rect({
                x: 800,
                y: yOffset + 20,
                width: 160,
                height: 60,
                fill: "#0bba14",
                stroke: "#42a847",
                strokeWidth: 2,
                cornerRadius: 8,
            });
            drinkBtn.on("mouseenter", () => {
                document.body.style.cursor = "pointer";
                drinkBtn.fill("#22c55e");
            });
            drinkBtn.on("mouseleave", () => {
                document.body.style.cursor = "default";
                drinkBtn.fill("#0bba14");
            });

            const index = i;
            drinkBtn.on("click tap", () => {
                document.body.style.cursor = "default";
                this.onDrinkPotion(index);
            });
            this.potionListGroup.add(drinkBtn);

            const drinkText = new Konva.Text({
                x: 800,
                y: yOffset + 35,
                width: 160,
                align: "center",
                text: "USE",
                fontSize: 24,
                fontFamily: "Arial",
                fontStyle: "bold",
                fill: "white",
                listening: false,
            });
            this.potionListGroup.add(drinkText);
        }

        this.group.getLayer()?.batchDraw();
    }

    /**
     * Show the screen
     */
    show(): void {
        this.group.visible(true);
        this.group.moveToTop();
        this.group.getLayer()?.draw();
    }

    /**
     * Hide the screen
     */
    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.draw();
    }

    isOpen(): boolean {
        return this.group.visible();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}

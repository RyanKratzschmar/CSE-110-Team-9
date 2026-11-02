import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../../constants.ts";

export class LevelMapScreenView implements View {
    private group: Konva.Group;
    private fight1: Konva.Rect;
    private fight1Text: Konva.Text;
    private fight2: Konva.Rect;
    private fight2Text: Konva.Text;
    private fight3: Konva.Rect;
    private fight3Text: Konva.Text;
    private rest: Konva.Line;
    private restText: Konva.Text;
    private stairs: Konva.Line;
    private stairsText: Konva.Text;
    private levelIndicator: Konva.Line;

    constructor(
        onGoClick : () => void,
    ){
    this.group = new Konva.Group({ visible: false });
        
    // Create Background Look
    const bg = new Konva.Rect({
        x: 0,
        y: 0,
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
        fill: "#EEE4C8",
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
        const healthBar = new Konva.Rect({
            x: 100,
            y: 35,
            width: 300,
            height: 70,
            fill: "#0bba14",
            stroke: "#42a847",        
        });  
        this.group.add(healthBar);

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

        // Create map location for fight 1
        this.fight1 = new Konva.Rect({
            cornerRadius: 10,
            width: 150,
            height: 150,
            x: 150,
            y: 500,
            fill: "#433550",
        })
        this.group.add(this.fight1);

        // Create Text for fight 1
        this.fight1Text = new Konva.Text({
            text: "Fight 1",
            x: 160,
            y: 690,
            fontSize: 40,
            fontStyle: "bold",
            fontFamily: "arial",
            fill: "black",
        })
        this.group.add(this.fight1Text);

        // Create map location for fight 2
        this.fight2 = new Konva.Rect({
            cornerRadius: 10,
            width: 150,
            height: 150,
            x: 425,
            y: 300,
            fill: "#3b3a3b",
        })
        this.group.add(this.fight2);

        this.fight2Text = new Konva.Text({
            text: "Fight 2",
            x: 435,
            y: 490,
            fontSize: 40,
            fontStyle: "bold",
            fontFamily: "arial",
            fill: "black",
        })
        this.group.add(this.fight2Text);

        // Create map location for fight 3
        this.fight3 = new Konva.Rect({
            cornerRadius: 10,
            width: 150,
            height: 150,
            x: 720,
            y: 400,
            fill: "#3b3a3b",
        })
        this.group.add(this.fight3);

        this.fight3Text = new Konva.Text({
            text: "Fight 3",
            x: 730,
            y: 590,
            fontSize: 40,
            fontStyle: "bold",
            fontFamily: "arial",
            fill: "black",
        });
        this.group.add(this.fight3Text);

        // Adds rest icon on the map
        this.rest = new Konva.Line({
            sides: 3,
            points: [1005, 290, 1155, 290, 1080, 440],
            closed: true,
            fill: "#3b3a3b",
        });
        this.group.add(this.rest);

        this.restText = new Konva.Text({
            text: "Rest",
            x: 1035,
            y: 460,
            fontSize: 40,
            fontStyle: "bold",
            fontFamily: "arial",
            fill: "black",
        });
        this.group.add(this.restText);

        // Adds stairs to next screen
        this.stairs = new Konva.Line({
            sides: 3,
            points: [1290, 700, 1440, 700, 1440, 550],
            closed: true,
            fill: "#3b3a3b"
        });
        this.group.add(this.stairs);

        this.stairsText = new Konva.Text({
            text: "Next Floor",
            x: 1270,
            y: 735,
            fontSize: 40,
            fontStyle: "bold",
            fontFamily: "arial",
            fill: "black",
        });
        this.group.add(this.stairsText);

        const goButton = new Konva.Rect({
            width: 200,
            height: 100,
            fill: "#FFC943",
            stroke: "#dda71e",
            cornerRadius: 10,
            x: 700,
            y: 750,
        });
        this.group.add(goButton);

        goButton.on("mouseenter", () => {
			document.body.style.cursor = "pointer";
		});

		goButton.on("mouseleave", () => {
			document.body.style.cursor = "default";
		});

        goButton.on("click tap", () => {
			onGoClick();
        });

        const goButtonText = new Konva.Text({
            text: "GO!",
            fontSize: 40,
            fontStyle: "bold",
            fontFamily: "arial",
            x: 760,
            y: 777.5,
            listening: false,
        });
        this.group.add(goButtonText);


        // Indicates which leve you're on
        this.levelIndicator = new Konva.Line({
            sides: 3,
            points: [200, 400, 250, 400, 225, 450],
            fill: "#cf8e00",
            closed: true,
            stroke: "#976700",
        });
        this.group.add(this.levelIndicator);

    }


    // Updates icon colors and level indicator
    updateIconColor(level : number) : void {
        if(level == 2){
            this.fight2.fill("#433550");
            this.levelIndicator.points([475, 200, 525, 200, 500, 250]);

        } else if (level == 3){
            this.fight3.fill("#433550");
            this.levelIndicator.points([770, 300, 820, 300, 795, 350]);

        } else if (level == 4){
            this.rest.fill("#433550");
            this.levelIndicator.points([1055, 200, 1105, 200, 1080, 250]);

        } else if (level == 5){
            this.stairs.fill("#433550");
            this.levelIndicator.points([1330, 500, 1380, 500, 1355, 550]);

        }
    }

    // Resets Icon Colors
    resetIconColor() : void {
        this.fight2.fill("#3b3a3b");
        this.fight3.fill("#3b3a3b");
        this.rest.fill("#3b3a3b");
        this.stairs.fill("#3b3a3b");
        this.levelIndicator.points([200, 400, 250, 400, 225, 450]);
    }

    /**
     * Show the screen
     */
    show(): void {
        this.group.visible(true);
        this.group.getLayer()?.draw();
    }

    /**
     * Hide the screen
     */
    hide(): void {
        this.group.visible(false);
        this.group.getLayer()?.draw();
    }

    getGroup(): Konva.Group {
        return this.group;
    }
}
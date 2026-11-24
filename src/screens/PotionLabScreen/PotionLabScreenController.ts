// PotionLabScreenController: connects the potion lab screen to this level's PotionLab: pick a potion, pick a recipe, answer one equation. (UI: Ryan; logic: Sally)

import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import type { GameSession } from "../../GameSession.ts";
import { PotionLabScreenView } from "./PotionLabScreenView.ts";
import type { WrongAnswerPopUpController } from "../../../frontend/src/wrongAnswerExplanationPopUp/controller/WrongAnswerPopUpController.ts";
import type { PotionLab } from "../../../backend/game/PotionLab.ts";
import { describePotion, type PotionType, type RecipeLevel } from "../../../backend/game/Potion.ts";

const POTION_NAMES: Record<PotionType, string> = { healing: "Healing", strength: "Strength", poison: "Poison" };

// Text for a recipe card, e.g. "Solve a 2-part equation. Heals 20% max HP."
function describeRecipe(type: PotionType, level: RecipeLevel): string {
    const solve = level === "basic" ? "Solve a 2-part equation." : "Solve a 3-part equation.";
    return `${solve} ${describePotion({ type, level })}.`;
}

export class PotionLabScreenController extends ScreenController {
    private view: PotionLabScreenView;
    private clickSound: HTMLAudioElement;
    private selectedType: PotionType | null = null;

    constructor(
        private readonly screenSwitcher: ScreenSwitcher,
        private readonly gameSession: GameSession,
        private readonly explanationPopUp?: WrongAnswerPopUpController,
    ) {
        super();
        this.view = new PotionLabScreenView(
            () => this.handleLeaveClick(),
            () => this.handleRecipeClick("basic"),
            () => this.handleRecipeClick("advanced"),
            () => this.handleSubmitClick(),
            () => this.handleContinueClick(),
            (type) => this.handleTypeClick(type),
            () => this.handlePemdasHelpClick(),
            () => !this.explanationPopUp?.isOpen(),
        );
        this.clickSound = new Audio("/click.mp3");
    }

    // The same lab all level, kept in GameState
    private get lab(): PotionLab {
        return this.gameSession.state.potionLabForLevel();
    }

    private playClick(): void {
        this.clickSound.currentTime = 0;
        void this.clickSound.play().catch(() => {});
    }

    startPotionLabScreen(): void {
        const player = this.gameSession.state.player;
        this.view.setPlayerHealthBar(player.hp, player.maxHp);
        this.selectedType = null;

        if (this.lab.isClosed()) {
            this.view.showResult(false, "You already used the potion lab on this floor.");
        } else {
            this.view.showChoices();
            this.view.setRecipeDescriptions("Pick a potion first.", "Pick a potion first.");
        }
        this.view.show();
    }

    // Healing, Strength, or Poison
    handleTypeClick(type: PotionType): void {
        this.playClick();
        this.lab.chooseType(type);
        this.selectedType = type;
        this.view.setSelectedType(type);
        this.view.setRecipeDescriptions(describeRecipe(type, "basic"), describeRecipe(type, "advanced"));
        this.view.showMessage("");
    }

    // Basic or Advanced: shows the equation
    handleRecipeClick(level: RecipeLevel): void {
        this.playClick();
        if (this.selectedType === null) {
            this.view.showMessage("Pick Healing, Strength, or Poison first.");
            return;
        }
        this.view.showEquation(this.lab.chooseRecipe(level));
    }

    // Opens the PEMDAS (order of operations) reminder pop-up
    handlePemdasHelpClick(): void {
        this.playClick();
        this.explanationPopUp?.showPemdasExplanation();
    }

    // One attempt: right = potion goes in the inventory, wrong = lab closes for this floor
    handleSubmitClick(): void {
        this.playClick();
        const answer = this.view.getAnswer();
        if (answer === null) {
            this.view.showMessage("Type your answer first.");
            return;
        }

        const lab = this.lab;
        const correctAnswer = lab.getEquation()?.getAnswer();
        if (lab.submit(answer)) {
            this.view.showResult(true, `${POTION_NAMES[this.selectedType!]} potion added to your inventory.`);
        } else {
            // TODO: use Arushi's WrongAnswerPopUpController once there is a PEMDAS explainer
            this.view.showResult(false, `Not quite! The answer was ${correctAnswer}. Come back next floor.`);
        }
    }

    // Leaving after the equation is shown uses up this floor's attempt
    handleLeaveClick(): void {
        this.playClick();
        this.lab.leave();
        this.backToRest();
    }

    handleContinueClick(): void {
        this.playClick();
        this.backToRest();
    }

    // Back to the rest stop, so "Leave Rest" still finishes the level
    private backToRest(): void {
        this.explanationPopUp?.close();
        this.screenSwitcher.switchToScreen({ type: "rest" });
    }

    getView(): PotionLabScreenView {
        return this.view;
    }
}
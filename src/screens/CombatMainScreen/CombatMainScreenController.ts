import type { WrongAnswerPopUpController } from "../../../frontend/src/wrongAnswerExplanationPopUp/controller/WrongAnswerPopUpController.ts";
import type { HintPopUpController } from "../../../frontend/src/hintPopUp/controller/HintPopUpController.ts";
import { ScreenController } from "../../types.ts";
import type { ScreenSwitcher } from "../../types.ts";
import { CombatMainScreenView } from "./CombatMainScreenView.ts";
import { CombatMainScreenModel } from "./CombatMainScreenModel.ts";
import type { GameSession } from "../../GameSession.ts";
import { finishCombat, requireCurrentStop } from "../../../backend/game/GameManager.ts";

import { Combat } from "../../../backend/game/Combat";
import { BasicMonster } from "../../../backend/game/BasicMonster";
import { PotionPopUpView } from "./PotionPopUpView.ts";
import { potionName } from "../../../backend/game/Potion.ts";
import { BackgroundMusic } from "../../BackgroundMusic.ts";

export class CombatMainScreenController extends ScreenController {
    private model: CombatMainScreenModel;
    private view: CombatMainScreenView;
    private screenSwitcher: ScreenSwitcher;

    private clickSound: HTMLAudioElement;
    private hitSound: HTMLAudioElement;
    private battleMusic: BackgroundMusic;

    private explanationPopUp: WrongAnswerPopUpController;
    private hintPopUp: HintPopUpController;
    private potionPopUp: PotionPopUpView;
    private gameSession: GameSession;
    private questionId: number | null = null;
    private answering = false;
    private pendingResult: "ongoing" | "win" | "lose" | null = null;

    constructor(
        screenSwitcher: ScreenSwitcher,
        explanationPopUp: WrongAnswerPopUpController,
        hintPopUp: HintPopUpController,
        gameSession: GameSession
    ) {
        super();
        this.gameSession = gameSession;
        this.screenSwitcher = screenSwitcher;
        this.explanationPopUp = explanationPopUp;
        this.hintPopUp = hintPopUp;

        this.model = new CombatMainScreenModel();
        this.view = new CombatMainScreenView(
            () => this.handleHintClick(),
            () => this.handleHintXClick(),
            () => this.handleAttackClick(),
            (answer) => this.handleSubmitClick(answer),
            () => this.handleExplanationClick(),
            () => this.handlePotionClick(),
            () => !this.hintPopUp.isOpen() && !this.explanationPopUp.isOpen(),
            () => this.handleCancelAttack()
        );

        this.potionPopUp = new PotionPopUpView(
            (index) => this.handleDrinkPotion(index),
            () => this.handlePotionBackClick()
        );
        this.view.getGroup().add(this.potionPopUp.getGroup());

        this.clickSound = new Audio("/click.mp3");

        this.hitSound = new Audio("/punch.mp3");

        // Battle music: the full track plays once as an intro, then the loop
        // version repeats for as long as the combat screen is showing
        this.battleMusic = new BackgroundMusic("/battle_bgm_intro.mp3", "/battle_bgm.ogg");
    }

    handleAttackClick(): void {
        this.clickSound.currentTime = 0;
        void this.clickSound.play().catch(() => {});

        if (this.gameSession.state.combat === null || this.gameSession.state.gameOver) return;
        if (this.pendingResult !== null) return;
        this.answering = true;
        this.view.solveEquation();

    }

    // Creates hint pop up
    handleHintClick(): void {
        this.clickSound.currentTime = 0;
        try {
            const promise = this.clickSound.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(() => {});
            }
        } catch {
            // Audio not supported in environment
        }

        const parts = this.gameSession.state.combat?.currentQuestion().question.match(/(\d+)\s*([×÷])\s*(\d+)/);
        if (!parts) return;
        if (parts[2] === "×") this.hintPopUp.showLongMultiplicationHint(Number(parts[1]), Number(parts[3]));
        else this.hintPopUp.showLongDivisionHint(Number(parts[1]), Number(parts[3]));
    }

    // Hides hint pop up
    handleHintXClick(): void {
        this.clickSound.currentTime = 0;
        try {
            const promise = this.clickSound.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(() => {});
            }
        } catch {
            // Audio not supported in environment
        }

        this.hintPopUp.close();
    }

    override hide(): void {
        this.answering = false;
        if (this.hintPopUp?.isOpen()) {
            this.hintPopUp.close();
        }
        if (this.explanationPopUp?.isOpen()) {
            this.explanationPopUp.close();
        }
        if (this.potionPopUp?.isOpen()) {
            this.potionPopUp.hide();
        }
        this.battleMusic.stop();
        super.hide();
    }

    handleCancelAttack(): void {
        this.clickSound.currentTime = 0;
        void this.clickSound.play().catch(() => {});

        this.answering = false;
        this.view.returnToCombat();
    }

    // Resolve the entered number against the fight in the shared browser game.
    handleSubmitClick(answer: number | null = null): void {
        const state = this.gameSession.state;
        const game = state.combat;
        if (this.hintPopUp.isOpen() || this.explanationPopUp.isOpen()) return;
        if (this.pendingResult !== null) {
            const outcome = this.pendingResult;
            this.pendingResult = null;
            this.view.returnToCombat();
            if (outcome === "ongoing" && game !== null) {
                game.startNextQuestion();
                this.syncCombat();
            } else {
                this.hide();
                this.screenSwitcher.switchToScreen({ type: outcome === "win" ? "map" : "gameover" });
            }
            return;
        }
        if (!this.answering || game === null || this.questionId === null) return;
        if (this.hintPopUp.isOpen() || this.explanationPopUp.isOpen()) return;
        if (answer === null || !Number.isSafeInteger(answer)) {
            this.view.setFeedback("Enter a valid whole-number answer.");
            return;
        }
        const result = game.resolveAnswer(answer, this.questionId);
        if (!result) return;
        this.answering = false;
        this.syncCombat();
        this.pendingResult = result.result;
        this.view.animateAttack(result.correct);

        this.hitSound.currentTime = 0;
        this.hitSound.play();

        let feedback = result.correct ? "Correct!" : `Incorrect. The correct answer is ${result.correctAnswer}.`;
        if (result.strengthBoosted) feedback += " Your strength potion doubled the damage!";
        if (result.poisonDamage > 0) feedback += ` Poison did ${result.poisonDamage} damage.`;
        this.view.setFeedback(
            feedback + (result.result === "win" ? " You won!" : result.result === "lose" ? " Game over." : ""),
            result.correct,
            true
        );
        if (!result.correct && result.result === "ongoing") {
            this.view.showExplanationButton();
        }
        if (result.result !== "ongoing") {
            finishCombat(state, result.result);
            state.combat = null;
            this.questionId = null;
            this.endFight(result.result === "win");
        }
    }

    private syncCombat(): void {
        const state = this.gameSession.state;
        const game = state.combat;
        if (game === null) return;
        const question = game.currentQuestion();
        this.questionId = question.questionId;
        this.model.setPlayerHealth(state.player.hp);
        this.model.setPlayerMaxHealth(state.player.maxHp);
        this.model.setEnemyCurrentHealth(game.getEnemyHp());
        this.model.setEnemyMaxHealth(game.getEnemyMaxHp());
        this.view.setQuestion(question.question);
        this.view.updateEnemyHealthBar(game.getEnemyHp(), game.getEnemyMaxHp());
        this.view.setPlayerHealthBar(state.player.hp, state.player.maxHp);
        this.view.setPotionStatus(this.describeActiveEffects(game));
    }

    // e.g. "Strength: 1 round left · Poison: 2 rounds left", or "" when no potion effect is active
    private describeActiveEffects(game: Combat): string {
        const { strengthRounds, poisonRounds } = game.getActiveEffects();
        const rounds = (n: number) => `${n} round${n === 1 ? "" : "s"} left`;
        const parts: string[] = [];
        if (strengthRounds > 0) parts.push(`Strength: ${rounds(strengthRounds)}`);
        if (poisonRounds > 0) parts.push(`Poison: ${rounds(poisonRounds)}`);
        return parts.join("  ·  ");
    }

    // Opens the potion popup to view and use potions
    handlePotionClick(): void {
        this.clickSound.currentTime = 0;
        void this.clickSound.play().catch(() => {});

        const state = this.gameSession.state;
        const combat = state.combat;
        if (!combat || this.pendingResult !== null) return;

        this.potionPopUp.updatePotions(state.player.inventory, state.player.hp, state.player.maxHp, state.player.potionHealingBonus);
        this.potionPopUp.show();
    }

    handlePotionBackClick(): void {
        this.clickSound.currentTime = 0;
        void this.clickSound.play().catch(() => {});

        this.potionPopUp.hide();
    }

    handleDrinkPotion(index: number): void {
        this.clickSound.currentTime = 0;
        void this.clickSound.play().catch(() => {});

        const state = this.gameSession.state;
        const combat = state.combat;
        if (!combat || this.pendingResult !== null) return;

        const result = combat.usePotion(index);
        if (!result) return;

        this.potionPopUp.hide();
        this.syncCombat();
        this.view.animateAttack(false);
        const healedText = result.healed > 0 ? ` +${result.healed} HP.` : "";
        const effects = this.describeActiveEffects(combat);
        this.view.setPotionStatus(
            `You drank: ${potionName(result.potion)}.${healedText}
The enemy hit you for ${result.damageTaken}.` +
            (effects ? `
${effects}` : "")
        );

        if (result.result === "lose") {
            finishCombat(state, "lose");
            state.combat = null;
            this.questionId = null;
            this.endFight(false);
            this.hide();
            this.screenSwitcher.switchToScreen({ type: "gameover" });
        }
    }

    getPotionPopUp(): PotionPopUpView {
        return this.potionPopUp;
    }


    // Ends the fight
    endFight(win: boolean): void {
        this.view.endGameText(win);
    }

    handleExplanationClick(): void {
        this.clickSound.currentTime = 0;
        void this.clickSound.play().catch(() => {});

        const parts = this.gameSession.state.combat?.currentQuestion().question.match(/(\d+)\s*([×÷])\s*(\d+)/);
        if (!parts) return;
        if (parts[2] === "×") this.explanationPopUp.showLongMultiplicationExplanation(Number(parts[1]), Number(parts[3]));
        else this.explanationPopUp.showLongDivisionExplanation(Number(parts[1]), Number(parts[3]));
    }

    startGame(): void {
        const state = this.gameSession.state;
        const node = requireCurrentStop(state, "combat");
        if (state.combat === null) state.combat = new Combat(state.player, new BasicMonster(node.difficulty), node.difficulty);
        this.answering = false;
        this.pendingResult = null;
        this.view.setFloorNum(state.level.number);
        state.combat.startNextQuestion();
        this.syncCombat();
        this.view.returnToCombat();
        this.view.resetFight();
        this.view.show();
        this.battleMusic.play();
    }

    getModel(): CombatMainScreenModel {
        return this.model;
    }

    getView(): CombatMainScreenView {
        return this.view;
    }
}

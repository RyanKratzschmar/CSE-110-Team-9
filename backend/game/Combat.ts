// Combat: one fight: gets questions, damages the enemy on right answers and the player on wrong ones, detects win/loss. (David)

import {Player} from "./Player";
import {Monster} from "./Monster";
import type { RandomEquation } from "../equations/RandomEquation";
import { getEquation } from "../equations/EquationFactory"; 
import {
    HEAL_PERCENT,
    POISON_DAMAGE_PERCENT,
    POISON_ROUNDS,
    STRENGTH_DAMAGE_MULTIPLIER,
    STRENGTH_ROUNDS,
    type Potion,
} from "./Potion";

type BattleStatus = "active" | "won" | "lost";

type CurrentQuestion = {
    questionId: number;
    question: string;
    playerHp: number;
    enemyHp: number;
};

type AnswerResult = {
    questionId: number;
    correct: boolean;
    correctAnswer: number;
    playerHp: number;
    enemyHp: number;
    result: "win" | "lose" | "ongoing";
    strengthBoosted: boolean; // a correct answer did boosted damage from a strength potion
    poisonDamage: number; // damage poison did to the enemy this round
};

export type PotionResult = {
    potion: Potion;
    healed: number; // HP restored (0 for strength and poison potions)
    strengthRounds: number; // rounds of boosted damage left after drinking
    poisonRounds: number; // rounds of poison left on the enemy after drinking
    damageTaken: number;
    playerHp: number;
    enemyHp: number;
    result: "win" | "lose" | "ongoing";
};

export class Combat {

    private player: Player;
    private enemy: Monster;
    private gameStatus: BattleStatus = "active";
    private currentEquation: RandomEquation;
    private questionId = 1;
    private questionResolved = false;
    private difficulty: number;
    private strengthRounds = 0; // answered questions left with boosted damage
    private poisonRounds = 0; // answered questions left with the enemy poisoned

    constructor(player: Player, enemy: Monster, difficulty: number,
        private readonly generateEquation: () => RandomEquation = () =>
            getEquation({type: "Combat"}, this.difficulty)
    ) {
        this.player = player;
        this.enemy = enemy;
        this.difficulty = difficulty;
        this.currentEquation = this.generateEquation();
        this.checkBattleStatus();
    }

    getGameStatus(): BattleStatus {
        return this.gameStatus;
    }

    getPlayerHp(): number {
        return this.player.hp;
    }

    getEnemyHp(): number {
        return this.enemy.hp;
    }

    getEnemyMaxHp(): number {
        return this.enemy.maxHp;
    }

    // Rounds left on potion effects, for the combat screen
    getActiveEffects(): { strengthRounds: number; poisonRounds: number } {
        return { strengthRounds: this.strengthRounds, poisonRounds: this.poisonRounds };
    }

    currentQuestion() : CurrentQuestion {
        return {
            questionId: this.questionId,
            question: this.currentEquation.getPrint(),
            playerHp: this.player.hp,
            enemyHp: this.enemy.hp,
        };
    }

    resolveAnswer(submission: number, questionId: number): AnswerResult | undefined{
        if (
            this.getGameStatus() !== "active" ||
            this.questionResolved ||
            questionId !== this.questionId
        ) {
            return undefined;
        }

        if (!Number.isFinite(submission)) {
            throw new Error("Answer must be a finite number");
        }

        const correct = this.currentEquation.checkAnswer(submission);
        const correctAnswer = this.currentEquation.getAnswer();

        this.questionResolved = true;

        // A strength potion boosts this round's attack; the round is used up either way
        const strengthActive = this.strengthRounds > 0;
        if (strengthActive) this.strengthRounds -= 1;

        // damage the monster
        if (correct) {
            const multiplier = strengthActive ? STRENGTH_DAMAGE_MULTIPLIER : 1;
            this.enemy.takeDamage(this.player.attack * multiplier);
        }
        else { // damage the player
            this.player.takeDamage(this.enemy.attack);
        }

        const poisonDamage = this.tickPoison();

        this.checkBattleStatus();

        const status = this.getGameStatus();

        return {
            questionId: this.questionId,
            correct,
            correctAnswer,
            playerHp: this.player.hp,
            enemyHp: this.enemy.hp,
            result:
                status === "won" 
                    ? "win"
                    : status === "lost"
                        ? "lose"
                        : "ongoing",
            strengthBoosted: correct && strengthActive,
            poisonDamage,
        };
    }

    startNextQuestion(): void {
        if (this.gameStatus !== "active" || !this.questionResolved) {
            return;
        }

        const nextEquation = this.generateEquation();

        this.currentEquation = nextEquation;
        this.questionId += 1;
        this.questionResolved = false;
    }

    usePotion(index = 0): PotionResult | undefined {
        if (this.gameStatus !== "active") {
            return undefined;
        }
        if (index < 0 || index >= this.player.inventory.length) {
            return undefined;
        }

        const potion = this.player.inventory[index];
        this.player.inventory.splice(index, 1);

        const prevHp = this.player.hp;
        if (potion.type === "strength") {
            this.strengthRounds += STRENGTH_ROUNDS[potion.level];
        } else if (potion.type === "poison") {
            this.poisonRounds += POISON_ROUNDS[potion.level];
        } else {
            const healPercent = (HEAL_PERCENT[potion.level] ?? 20) + this.player.potionHealingBonus;
            const healAmount = Math.max(1, Math.round((this.player.maxHp * healPercent) / 100));
            this.player.heal(healAmount);
        }
        const healed = this.player.hp - prevHp;

        // Enemy counter-attacks
        const hpBeforeEnemy = this.player.hp;
        this.player.takeDamage(this.enemy.attack);
        const damageTaken = hpBeforeEnemy - this.player.hp;

        this.checkBattleStatus();

        const status = this.getGameStatus();

        return {
            potion,
            healed,
            strengthRounds: this.strengthRounds,
            poisonRounds: this.poisonRounds,
            damageTaken,
            playerHp: this.player.hp,
            enemyHp: this.enemy.hp,
            result:
                status === "won"
                    ? "win"
                    : status === "lost"
                        ? "lose"
                        : "ongoing",
        };
    }


    // Poison hurts the enemy once per answered question while it lasts; returns the damage done
    private tickPoison(): number {
        if (this.poisonRounds <= 0 || this.enemy.isDead()) return 0;
        this.poisonRounds -= 1;
        const hpBefore = this.enemy.hp;
        this.enemy.takeDamage(Math.max(1, Math.round((this.enemy.maxHp * POISON_DAMAGE_PERCENT) / 100)));
        return hpBefore - this.enemy.hp;
    }

    private checkBattleStatus(): void {
        if (this.player.isDead()) {
            this.gameStatus = "lost";
        } else if (this.enemy.isDead()) {
            this.gameStatus = "won";
        }
    }
}
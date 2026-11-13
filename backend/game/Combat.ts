// Combat: one fight: gets questions, damages the enemy on right answers and the player on wrong ones, detects win/loss. (David)

import {Player} from "./Player";
import {Monster} from "./Monster";
import type { RandomEquation } from "../equations/RandomEquation";
import { MultiplicationEquation } from "../equations/MultiplicationEquation";
import { DivisionEquation } from "../equations/DivisionEquation";

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
};

/** Manages one fight. Routes and GameManager handle screen and level progression. */
export class Combat {

    private player: Player;
    private enemy: Monster;
    private gameStatus: BattleStatus = "active";
    private currentEquation: RandomEquation;
    private questionId = 1;
    private questionResolved = false;

    // Reuse the run's player to preserve HP. Tests can supply a fixed equation generator.
    constructor(player: Player, enemy: Monster,
        private readonly generateEquation: () => RandomEquation = () =>
            Math.random() < 0.5
                ? new MultiplicationEquation(false)
                : new DivisionEquation(false)
    ) {
        this.player = player;
        this.enemy = enemy;
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

    /** Reads the question without replacing it or revealing its answer. IDs are local to this fight. */
    currentQuestion() : CurrentQuestion {
        return {
            questionId: this.questionId,
            question: this.currentEquation.getPrint(),
            playerHp: this.player.hp,
            enemyHp: this.enemy.hp,
        };
    }

    /**
     * Checks one numeric answer and applies damage once for the current question.
     * Returns undefined for duplicate/stale submissions or a finished fight.
     * Non-finite answers throw without consuming the question.
     * After an ongoing result, call startNextQuestion() to allow another turn.
     */
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

        // only for main game - questionResolved makes it so you can't reuse the same question
        this.questionResolved = true;

        // damage the monster
        if (correct) {
            this.enemy.takeDamage(this.player.attack);
        }
        else { // damage the player
            this.player.takeDamage(this.enemy.attack);
        }

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
        };
    }

    /** Advances only after an answered question while the fight is still active. */
    startNextQuestion(): void {
        if (this.gameStatus !== "active" || !this.questionResolved) {
            return;
        }

        const nextEquation = this.generateEquation();

        this.currentEquation = nextEquation;
        this.questionId += 1;
        this.questionResolved = false;
    }


    // Check starting HP as well as HP after each resolved answer.
    private checkBattleStatus(): void {
        if (this.player.isDead()) {
            this.gameStatus = "lost";
        } else if (this.enemy.isDead()) {
            this.gameStatus = "won";
        }
    }
}

// Combat: one fight: gets questions, damages the enemy on right answers and the player on wrong ones, detects win/loss. (David)

import {Player} from "./Player";
import {Monster} from "./Monster";
import type { RandomEquation } from "../equations/RandomEquation";
import { getEquation } from "../equations/EquationFactory"; 

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

export class Combat {

    private player: Player;
    private enemy: Monster;
    private gameStatus: BattleStatus = "active";
    private currentEquation: RandomEquation;
    private questionId = 1;
    private questionResolved = false;
    private difficulty: number;

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

    startNextQuestion(): void {
        if (this.gameStatus !== "active" || !this.questionResolved) {
            return;
        }

        const nextEquation = getEquation({type: "Combat"}, this.difficulty);

        this.currentEquation = nextEquation;
        this.questionId += 1;
        this.questionResolved = false;
    }


    private checkBattleStatus(): void {
        if (this.player.isDead()) {
            this.gameStatus = "lost";
        } else if (this.enemy.isDead()) {
            this.gameStatus = "won";
        }
    }
}
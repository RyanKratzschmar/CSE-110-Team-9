// UpgradeMinigame: 60-second times-table challenge at the rest stop; checks answers, shows the correct one, and gives one upgrade per level that raises all stats. (David)

import { getEquation } from "../equations/EquationFactory";
import type { RandomEquation } from "../equations/RandomEquation";

export class UpgradeMinigame {
    private readonly endsAt: number;
    private equation: RandomEquation;
    private questionId = 1;
    private correctAnswers = 0;

    constructor() {
        this.endsAt = Date.now() + 60_000;
        this.equation = getEquation({ type: "Upgrade" }, 0);
    }

    getRemainingTime(): number {
        return Math.max(0, this.endsAt - Date.now());
    }

    isFinished(): boolean {
        return this.getRemainingTime() === 0;
    }

    getCorrectAnswers(): number {
        return this.correctAnswers;
    }

    currentQuestion() {
        return {
            questionId: this.questionId,
            question: this.equation.getPrint(),
        };
    }

    hasEarnedUpgrade(): boolean {
        return this.correctAnswers >= 10;
    }

    submitAnswer(answer: number, questionId: number) {
        if (this.isFinished()) {
            throw new Error("The minigame has ended");
        }

        if (questionId !== this.questionId) {
            throw new Error("Question is no longer current");
        }

        if (!Number.isFinite(answer)) {
            throw new Error("Answer must be a finite number");
        }

        const correct = this.equation.checkAnswer(answer);
        const correctAnswer = this.equation.getAnswer();
        const answeredQuestionId = this.questionId;

        if (correct) {
            this.correctAnswers += 1;
            this.equation = getEquation({ type: "Upgrade" }, 0);
            this.questionId += 1;
        }

        return {
            questionId: answeredQuestionId,
            correct,
            correctAnswer,
            correctAnswers: this.correctAnswers,
            remainingTime: this.getRemainingTime(),
        };
    }
}
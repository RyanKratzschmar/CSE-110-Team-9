import { afterEach, describe, expect, it, vi } from "vitest";
import { getEquation } from "../backend/equations/EquationFactory";
import { UpgradeMinigame } from "../backend/game/UpgradeMinigame";

afterEach(() => vi.restoreAllMocks());

describe("Oliver's upgrade equation factory", () => {
    it.each([
        [0.1, 0, "Multiplication", [0, "*", 0], 0],
        [0.1, 0.999999, "Multiplication", [12, "*", 12], 144],
        [0.9, 0, "Division", [1, "/", 1], 1],
        [0.9, 0.999999, "Division", [144, "/", 12], 12],
    ])("generates %s/%s within the upgrade range", (choice, factor, type, equation, answer) => {
        vi.spyOn(Math, "random").mockReturnValueOnce(choice as number).mockReturnValue(factor as number);
        const question = getEquation({ type: "Upgrade" }, 100);
        expect(question.getType()).toBe(type);
        expect(question.getEquation()).toEqual(equation);
        expect(question.getAnswer()).toBe(answer);
        expect(question.checkAnswer(answer as number)).toBe(true);
        expect(question.checkAnswer((answer as number) + 1)).toBe(false);
    });

    it("uses division questions in the minigame and advances after a correct answer", () => {
        vi.spyOn(Math, "random").mockReturnValue(0.9);
        const game = new UpgradeMinigame();
        const question = game.currentQuestion();
        expect(question.question).toContain("/");
        expect(game.submitAnswer(11, question.questionId)).toMatchObject({ correct: true, correctAnswers: 1 });
        expect(game.currentQuestion().questionId).toBe(2);
    });
});

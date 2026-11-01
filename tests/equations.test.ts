// Tests that every equation type returns the correct answer for its equation. (Oliver)

import { describe, expect, it } from "vitest";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";
import { DivisionEquation } from "../backend/equations/DivisionEquation";

// MultiplicationEquation Test
describe("Multiplication", () => {
    // Test predetermined input and getter methods
    it("accepts predetermined inputs", () => {
        const print = "37 * 15 = ";
        const answer = 555;
        const equation = [37, "*", 15];
        const multiplication = new MultiplicationEquation(true, print, answer, equation);
        // Print
        expect(multiplication.getEquation()).toBe(print);
        // Type
        expect(multiplication.getType()).toBe("Multiplication");
        // Answer
        expect(multiplication.getAnswer()).toBe(answer);
        // Equation
        expect(multiplication.getEquation).toBe(equation);
    });

    // Test random equation
    it("returns the correct answer", () => {
        const multiplication = new MultiplicationEquation(false);
        let factorOne = multiplication.getEquation()[0];
        let factorTwo = multiplication.getEquation()[2];
        let answer = factorOne * factorTwo;
        expect(multiplication.getAnswer()).toBe(answer);
        expect(multiplication.checkAnswer(answer)).toBe(true);
        expect(multiplication.checkAnswer(-1)).toBe(false);
    });
});

// DivisionEquation Test
describe("Division", () => {
    // Test predetermined input and getter methods
    it("accepts predetermined inputs", () => {
        const print = "600 / 15 = ";
        const answer = 40;
        const equation = [600, "/", 15];
        const division = new DivisionEquation(true, print, answer, equation);
        // Print
        expect(division.getEquation()).toBe(print);
        // Type
        expect(division.getType()).toBe("Division");
        // Answer
        expect(division.getAnswer()).toBe(answer);
        // Equation
        expect(division.getEquation).toBe(equation);
    });

    // Test random equation
    it("returns the correct answer", () => {
        const division = new DivisionEquation(false);
        let bigNum = division.getEquation()[0];
        let divisor = division.getEquation()[2];
        let answer = Math.floor(bigNum / divisor);
        expect(division.getAnswer()).toBe(answer);
        expect(division.checkAnswer(answer)).toBe(true);
        expect(division.checkAnswer(-1)).toBe(false);
    });
});
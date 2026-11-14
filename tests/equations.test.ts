// Tests that every equation type returns the correct answer for its equation. (Oliver)

import { describe, expect, it } from "vitest";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";
import { DivisionEquation } from "../backend/equations/DivisionEquation";
import { MultiOperationEquation } from "../backend/equations/MultiOperatorEquation";

// Each test should account for the answer, equation, print, and type


// MultiplicationEquation Test
describe("Multiplication", () => {
    // Test for starting difficulty 1 -> base equation
    it("works with difficulty 1", () => {
        const mult = new MultiplicationEquation(1);
        // Type should be multiplication
        expect(mult.getType()).toBe("Multiplication")
        // Equation is first term, mult symbol, second term
        expect(mult.getEquation().length).toBe(3);
        let term1 = mult.getEquation()[0];
        let term2 = mult.getEquation()[2];
        // Term 1 is a 2-3 digit number
        expect(term1).toBeLessThanOrEqual(99);
        expect(term1).toBeGreaterThanOrEqual(10);
        // Term 2 is a 2-4 digit number
        expect(term2).toBeLessThanOrEqual(999);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Answer is first term times second term
        expect(mult.getAnswer()).toBe(term1 * term2);
        // Check print based on terms
        let print = String(term1) + "*" + String(term2) + "=?";
        expect(mult.getPrint()).toBe(print);
      });

    // Test for input 0 -> should be same as 1
    it("works with difficulty 0", () => {
        const mult = new MultiplicationEquation(0);
        // Type should be multiplication
        expect(mult.getType()).toBe("Multiplication")
        // Equation is first term, mult symbol, second term
        expect(mult.getEquation().length).toBe(3);
        let term1 = mult.getEquation()[0];
        let term2 = mult.getEquation()[2];
        // Term 1 is a 2-3 digit number
        expect(term1).toBeLessThanOrEqual(99);
        expect(term1).toBeGreaterThanOrEqual(10);
        // Term 2 is a 2-4 digit number
        expect(term2).toBeLessThanOrEqual(999);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Answer is first term times second term
        expect(mult.getAnswer()).toBe(term1 * term2);
        // Check print based on terms
        let print = String(term1) + "*" + String(term2) + "=?";
        expect(mult.getPrint()).toBe(print);
    });

    // Test that first digit can be larger
    it("scales the first term with higher difficulty", () => {
        const mult = new MultiplicationEquation(20);
        // Type should be multiplication
        expect(mult.getType()).toBe("Multiplication")
        // Equation is first term, mult symbol, second term
        expect(mult.getEquation().length).toBe(3);
        let term1 = mult.getEquation()[0];
        let term2 = mult.getEquation()[2];
        // Term 1 is a 2-4 digit number
        expect(term1).toBeLessThanOrEqual(999);
        expect(term1).toBeGreaterThanOrEqual(10);
        // Term 2 is a 2-4 digit number
        expect(term2).toBeLessThanOrEqual(999);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Answer is first term times second term
        expect(mult.getAnswer()).toBe(term1 * term2);
        // Check print based on terms
        let print = String(term1) + "*" + String(term2) + "=?";
        expect(mult.getPrint()).toBe(print);
    });

    // Test for difficulties greater than 25 -> should be larger than 2 terms
    it("works with difficulty 30 (>25)", () => {
        const mult = new MultiplicationEquation(30);
        // Type should be multiplication
        expect(mult.getType()).toBe("Multiplication")
        // Equation is first term, mult symbol, second term
        expect(mult.getEquation().length).toBe(5);
        let term1 = mult.getEquation()[0];
        let term2 = mult.getEquation()[2];
        let term3 = mult.getEquation()[4];
        // Term 1 is a 2-3 digit number
        expect(term1).toBeLessThanOrEqual(99);
        expect(term1).toBeGreaterThanOrEqual(10);
        // Term 2 is a 2-4 digit number
        expect(term2).toBeLessThanOrEqual(999);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Term 3 is a 2-4 digit number
        expect(term3).toBeLessThanOrEqual(999);
        expect(term3).toBeGreaterThanOrEqual(10);
        // Answer is first term times second term
        expect(mult.getAnswer()).toBe(term1 * term2 * term3);
        // Check print based on terms
        let print = String(term1) + "*" + String(term2) + "*" + String(term3) + "=?";
        expect(mult.getPrint()).toBe(print);
      });

    // Test for negative difficulties -> should have terms less than 13, product less than 145
    it("works with negative input", () => {
        const mult = new MultiplicationEquation(-1);
        // Type should be multiplication
        expect(mult.getType()).toBe("Multiplication");
        // Equation is first term, mult symbol, second term
        let term1 = mult.getEquation()[0];
        let term2 = mult.getEquation()[2];
        // Both terms should be between 0 and 12
        expect(term1).toBeLessThanOrEqual(12);
        expect(term1).toBeGreaterThanOrEqual(0);
        expect(term2).toBeLessThanOrEqual(12);
        expect(term2).toBeGreaterThanOrEqual(0);
        // Answer is first term times second term
        expect(mult.getAnswer()).toBe(term1 * term2);
        // Check print based on terms
        let print = String(term1) + "*" + String(term2) + "=?";
        expect(mult.getPrint()).toBe(print);
    });
    
});

// DivisionEquation Test
describe("Division", () => {
    // Test for starting difficulty 1 -> base equation
    it("works with difficulty 1", () => {
        const div = new DivisionEquation(1);
        // Type should be division
        expect(div.getType()).toBe("Division");
        // Equation is first term (large) division symbol second term
        let term1 = div.getEquation()[0];
        let term2 = div.getEquation()[2];
        let answer = div.getAnswer();
        // Term 2 should be between 10 and 100
        expect(term2).toBeLessThanOrEqual(100);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Answer should be unaltered bounds wise
        expect(answer).toBeLessThanOrEqual(100);
        expect(answer).toBeGreaterThanOrEqual(10);
        // Answer should be term1 / term 2
        expect(answer).toBe(term1 / term2);
        // Check print based on terms
        let print = String(term1) + "/" + String(term2) + "=?";
        expect(div.getPrint()).toBe(print);
    });

    // Test for input 0 -> should be same as 1
    it("works with difficulty 0", () => {
        const div = new DivisionEquation(0);
        // Type should be division
        expect(div.getType()).toBe("Division");
        // Equation is first term (large) division symbol second term
        let term1 = div.getEquation()[0];
        let term2 = div.getEquation()[2];
        let answer = div.getAnswer();
        // Term 2 should be between 10 and 100
        expect(term2).toBeLessThanOrEqual(100);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Answer should be unaltered bounds wise
        expect(answer).toBeLessThanOrEqual(100);
        expect(answer).toBeGreaterThanOrEqual(10);
        // Answer should be term1 / term 2
        expect(answer).toBe(term1 / term2);
        // Check print based on terms
        let print = String(term1) + "/" + String(term2) + "=?";
        expect(div.getPrint()).toBe(print);
    });

    // Test for difficulties greater than 25 -> should be a larger answer
    it("works with difficulty 30 (>25)", () => {
        const div = new DivisionEquation(30);
        // Type should be division
        expect(div.getType()).toBe("Division");
        // Equation is first term (large) division symbol second term
        let term1 = div.getEquation()[0];
        let term2 = div.getEquation()[2];
        let answer = div.getAnswer();
        // Term 2 should be between 10 and 100
        expect(term2).toBeLessThanOrEqual(100);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Answer should be lowerBounds*10 and upperBounds*20
        expect(answer).toBeLessThanOrEqual(2000);
        expect(answer).toBeGreaterThanOrEqual(100);
        // Answer should be term1 / term 2
        expect(answer).toBe(term1 / term2);
        // Check print based on terms
        let print = String(term1) + "/" + String(term2) + "=?";
        expect(div.getPrint()).toBe(print);
    });

    // Test for negative difficulties -> first term less than 145, second term and answer less than 13 (and not zero)
    it("works with negative input", () => {
        const div = new DivisionEquation(-1);
        // Type should be multiplication
        expect(div.getType()).toBe("Division");
        // Equation is first term (large) division symbol second term
        let term1 = div.getEquation()[0];
        let term2 = div.getEquation()[2];
        let answer = div.getAnswer();
        // Term 1 should be between 0 and 144
        expect(term1).toBeLessThanOrEqual(144);
        expect(term1).toBeGreaterThanOrEqual(0);
        // Term 2 should be between 0 and 12
        expect(term2).toBeLessThanOrEqual(12);
        expect(term2).toBeGreaterThanOrEqual(0);
        // Answer should be between 0 and 12
        expect(answer).toBeLessThanOrEqual(12);
        expect(answer).toBeGreaterThanOrEqual(0);
        // Answer should be term1 / term 2
        expect(answer).toBe(term1 / term2);
        // Check print based on terms
        let print = String(term1) + "/" + String(term2) + "=?";
        expect(div.getPrint()).toBe(print);
    });
});

// PEMDAS Test
describe("Pemdas", () => {
    // Test for starting difficulty 1 -> base 1 mult/div +/- 1 mult/div
    it("works with difficulty 1", () => {
        const pemdas = new MultiOperationEquation(1);
        // Type shuld be Pemdas
        expect(pemdas.getType()).toBe("Pemdas");
        // Equation is first term */ second term +- third term */ fourth term
        expect(pemdas.getEquation().length).toBe(7);
        // Each term should be between 0 and 144 (if big for division)
        let term1 = pemdas.getEquation()[0];
        expect(term1).toBeLessThanOrEqual(144);
        expect(term1).toBeGreaterThanOrEqual(0);
        let term2 = pemdas.getEquation()[2];
        expect(term2).toBeLessThanOrEqual(144);
        expect(term2).toBeGreaterThanOrEqual(0);
        let term3 = pemdas.getEquation()[4];
        expect(term3).toBeLessThanOrEqual(144);
        expect(term3).toBeGreaterThanOrEqual(0);
        let term4 = pemdas.getEquation()[6];
        expect(term4).toBeLessThanOrEqual(144);
        expect(term4).toBeGreaterThanOrEqual(0);
        // Answer should be combined from equations
        let ans1;
        let ans2;
        // Index 1 is mult div for first part
        if (pemdas.getEquation()[1] === "*") {
            ans1 = term1 * term2;
        } else {
            ans1 = term1 / term2;
        }
        // Index 5 is mult div for second part
        if (pemdas.getEquation()[5] === "*") {
            ans2 = term3 * term4;
        } else {
            ans2 = term3 / term4;
        }
        let final;
        // Index 3 is add sub for full ans
        if (pemdas.getEquation()[3] === "+") {
            final = ans1 + ans2;
        } else {
            final = ans1 - ans2;
        }
        expect(pemdas.getAnswer()).toBe(final);
        // Print should be based on the bounds of the size
        expect(pemdas.getPrint().length).toBeLessThanOrEqual(13);
        expect(pemdas.getPrint().length).toBeGreaterThanOrEqual(9);
    });

    // Test for input 0 -> should be the same as 1
    it("works with difficulty 0", () => {
        const pemdas = new MultiOperationEquation(0);
        // Type shuld be Pemdas
        expect(pemdas.getType()).toBe("Pemdas");
        // Equation is first term */ second term +- third term */ fourth term
        expect(pemdas.getEquation().length).toBe(7);
        // Each term should be between 0 and 144 (if big for division)
        let term1 = pemdas.getEquation()[0];
        expect(term1).toBeLessThanOrEqual(144);
        expect(term1).toBeGreaterThanOrEqual(0);
        let term2 = pemdas.getEquation()[2];
        expect(term2).toBeLessThanOrEqual(144);
        expect(term2).toBeGreaterThanOrEqual(0);
        let term3 = pemdas.getEquation()[4];
        expect(term3).toBeLessThanOrEqual(144);
        expect(term3).toBeGreaterThanOrEqual(0);
        let term4 = pemdas.getEquation()[6];
        expect(term4).toBeLessThanOrEqual(144);
        expect(term4).toBeGreaterThanOrEqual(0);
        // Answer should be combined from equations
        let ans1;
        let ans2;
        // Index 1 is mult div for first part
        if (pemdas.getEquation()[1] === "*") {
            ans1 = term1 * term2;
        } else {
            ans1 = term1 / term2;
        }
        // Index 5 is mult div for second part
        if (pemdas.getEquation()[5] === "*") {
            ans2 = term3 * term4;
        } else {
            ans2 = term3 / term4;
        }
        let final;
        // Index 3 is add sub for full ans
        if (pemdas.getEquation()[3] === "+") {
            final = ans1 + ans2;
        } else {
            final = ans1 - ans2;
        }
        expect(pemdas.getAnswer()).toBe(final);
        // Print should be based on the bounds of the size
        expect(pemdas.getPrint().length).toBeLessThanOrEqual(13);
        expect(pemdas.getPrint().length).toBeGreaterThanOrEqual(9);
    });

    // Test for difficulties greater than 25 -> should be larger than 2 equations
    it("works with difficulty 30 (>25)", () => {
        const pemdas = new MultiOperationEquation(30);
        // Type shuld be Pemdas
        expect(pemdas.getType()).toBe("Pemdas");
        // Equation is first term */ second term +- third term */ fourth term +- fifth term */ sixth term
        expect(pemdas.getEquation().length).toBe(11);
        // Each term should be between 0 and 144 (if big for division)
        let term1 = pemdas.getEquation()[0];
        expect(term1).toBeLessThanOrEqual(144);
        expect(term1).toBeGreaterThanOrEqual(0);
        let term2 = pemdas.getEquation()[2];
        expect(term2).toBeLessThanOrEqual(144);
        expect(term2).toBeGreaterThanOrEqual(0);
        let term3 = pemdas.getEquation()[4];
        expect(term3).toBeLessThanOrEqual(144);
        expect(term3).toBeGreaterThanOrEqual(0);
        let term4 = pemdas.getEquation()[6];
        expect(term4).toBeLessThanOrEqual(144);
        expect(term4).toBeGreaterThanOrEqual(0);
        let term5 = pemdas.getEquation()[8];
        expect(term5).toBeLessThanOrEqual(144);
        expect(term5).toBeGreaterThanOrEqual(0);
        let term6 = pemdas.getEquation()[10];
        expect(term6).toBeLessThanOrEqual(144);
        expect(term6).toBeGreaterThanOrEqual(0);
        // Answer should be combined from equations
        let ans1;
        let ans2;
        let ans3;
        // Index 1 is mult div for first part
        if (pemdas.getEquation()[1] === "*") {
            ans1 = term1 * term2;
        } else {
            ans1 = term1 / term2;
        }
        // Index 5 is mult div for second part
        if (pemdas.getEquation()[5] === "*") {
            ans2 = term3 * term4;
        } else {
            ans2 = term3 / term4;
        }
        // Index 9 is mult div for third part
        if (pemdas.getEquation()[9] === "*") {
            ans3 = term5 * term6;
        } else {
            ans3 = term5 / term6;
        }
        let first;
        let final;
        // Index 3 is add sub for first two parts
        if (pemdas.getEquation()[3] === "+") {
            first = ans1 + ans2;
        } else {
            first = ans1 - ans2;
        }
        // Index 7 is add sub for full ans
        if (pemdas.getEquation()[7] === "+") {
            final = first + ans3;
        } else {
            final = first - ans3;
        }
        expect(pemdas.getAnswer()).toBe(final);
        // Print should be based on the bounds of the size, 6 terms each of size 1 or 2
        expect(pemdas.getPrint().length).toBeLessThanOrEqual(19);
        expect(pemdas.getPrint().length).toBeGreaterThanOrEqual(13);
    });

    // Test for negative difficulties -> should throw error
    it("breaks on negative difficulties", async () => {
        try {
            await new MultiOperationEquation(-1);
            expect.fail('Expect failure')
        } catch (error) {
            expect(String(error)).toBe('Error: Negative difficulty for PEMDAS');
        }
    })
});
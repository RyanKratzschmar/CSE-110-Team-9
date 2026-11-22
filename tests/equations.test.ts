// Tests that every equation type returns the correct answer for its equation. (Oliver)

import { describe, expect, it } from "vitest";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";
import { DivisionEquation } from "../backend/equations/DivisionEquation";
import { MultiOperationEquation } from "../backend/equations/MultiOperationEquation";

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
        expect(term1).toBeLessThanOrEqual(100);
        expect(term1).toBeGreaterThanOrEqual(10);
        // Term 2 is a 2-4 digit number
        expect(term2).toBeLessThanOrEqual(1000);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Answer is first term times second term
        expect(mult.getAnswer()).toBe(term1 * term2);
        // Check print based on terms
        let print = String(term1) + " " + "\u00D7" + " " + String(term2) + " = ?";
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
        expect(term1).toBeLessThanOrEqual(100);
        expect(term1).toBeGreaterThanOrEqual(10);
        // Term 2 is a 2-4 digit number
        expect(term2).toBeLessThanOrEqual(1000);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Answer is first term times second term
        expect(mult.getAnswer()).toBe(term1 * term2);
        // Check print based on terms
        let print = String(term1) + " " + "\u00D7" + " " + String(term2) + " = ?";
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
        expect(term1).toBeLessThanOrEqual(1000);
        expect(term1).toBeGreaterThanOrEqual(10);
        // Term 2 is a 2-4 digit number
        expect(term2).toBeLessThanOrEqual(1000);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Answer is first term times second term
        expect(mult.getAnswer()).toBe(term1 * term2);
        // Check print based on terms
        let print = String(term1) + " " + "\u00D7" + " " + String(term2) + " = ?";
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
        expect(term1).toBeLessThanOrEqual(100);
        expect(term1).toBeGreaterThanOrEqual(10);
        // Term 2 is a 2-4 digit number
        expect(term2).toBeLessThanOrEqual(1000);
        expect(term2).toBeGreaterThanOrEqual(10);
        // Term 3 is a 2-4 digit number
        expect(term3).toBeLessThanOrEqual(1000);
        expect(term3).toBeGreaterThanOrEqual(10);
        // Answer is first term times second term
        expect(mult.getAnswer()).toBe(term1 * term2 * term3);
        // Check print based on terms
        let print = String(term1) + " " + "\u00D7" + " " + String(term2) + " " + "\u00D7" + " " + String(term3) + " = ?";
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
        let print = String(term1) + " " + "\u00D7" + " " + String(term2) + " = ?";
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
        let print = String(term1) + " " + "\u00F7" + " " + String(term2) + " = ?";
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
        let print = String(term1) + " " + "\u00F7" + " " + String(term2) + " = ?";
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
        let print = String(term1) + " " + "\u00F7" + " " + String(term2) + " = ?";
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
        let print = String(term1) + " " + "\u00F7" + " " + String(term2) + " = ?";
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
        // Each term should be between the base values as determined by mult and division (from 2-5 digits)
        let term1 = pemdas.getEquation()[0];
        expect(term1).toBeLessThanOrEqual(10000);
        expect(term1).toBeGreaterThanOrEqual(10);
        let term2 = pemdas.getEquation()[2];
        expect(term2).toBeLessThanOrEqual(10000);
        expect(term2).toBeGreaterThanOrEqual(10);
        let term3 = pemdas.getEquation()[4];
        expect(term3).toBeLessThanOrEqual(10000);
        expect(term3).toBeGreaterThanOrEqual(10);
        let term4 = pemdas.getEquation()[6];
        expect(term4).toBeLessThanOrEqual(10000);
        expect(term4).toBeGreaterThanOrEqual(10);
        // Answer should be combined from equations
        let ans1;
        let ans2;
        // Index 1 is mult div for first part
        if (pemdas.getEquation()[1] ===  "\u00D7") {
            ans1 = term1 * term2;
        } else {
            ans1 = term1 / term2;
        }
        // Index 5 is mult div for second part
        if (pemdas.getEquation()[5] === "\u00D7") {
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
        // Print should be based on the bounds of the size, all numbers are between 1 and 3 digits
        const print = String(term1) + " x " + String(term2) + " x " + String(term3) + " x " + String(term4) + " = ?";
        expect(pemdas.getPrint().length).toBe(print.length);
    });

    // Test for input 0 -> should be the same as 1
    it("works with difficulty 0", () => {
        const pemdas = new MultiOperationEquation(0);
        // Type shuld be Pemdas
        expect(pemdas.getType()).toBe("Pemdas");
        // Equation is first term */ second term +- third term */ fourth term
        expect(pemdas.getEquation().length).toBe(7);
        // Each term should be between the base values as determined by mult and division (from 2-5 digits)
        let term1 = pemdas.getEquation()[0];
        expect(term1).toBeLessThanOrEqual(10000);
        expect(term1).toBeGreaterThanOrEqual(10);
        let term2 = pemdas.getEquation()[2];
        expect(term2).toBeLessThanOrEqual(10000);
        expect(term2).toBeGreaterThanOrEqual(10);
        let term3 = pemdas.getEquation()[4];
        expect(term3).toBeLessThanOrEqual(10000);
        expect(term3).toBeGreaterThanOrEqual(10);
        let term4 = pemdas.getEquation()[6];
        expect(term4).toBeLessThanOrEqual(10000);
        expect(term4).toBeGreaterThanOrEqual(10);
        // Answer should be combined from equations
        let ans1;
        let ans2;
        // Index 1 is mult div for first part
        if (pemdas.getEquation()[1] === "\u00D7") {
            ans1 = term1 * term2;
        } else {
            ans1 = term1 / term2;
        }
        // Index 5 is mult div for second part
        if (pemdas.getEquation()[5] === "\u00D7") {
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
        const print = String(term1) + " x " + String(term2) + " x " + String(term3) + " x " + String(term4) + " = ?";
        expect(pemdas.getPrint().length).toBe(print.length);
    });

    // Test for difficulties greater than 25 -> should be larger than 2 equations
    it("works with difficulty 30 (>25)", () => {
        const pemdas = new MultiOperationEquation(30);
        // Type shuld be Pemdas
        expect(pemdas.getType()).toBe("Pemdas");
        // Equation is eq1 +- eq2 +- eq3 (each equation is term */ term)
        // With difficulty high, mult gives more terms per equation, each equation could be 5 terms instead of 3 terms
        expect(pemdas.getEquation().length).toBeGreaterThanOrEqual(11);
        expect(pemdas.getEquation().length).toBeLessThanOrEqual(17);
        // Four distinct realities exist, length 11, length 13, length 15, length 17
        
        if(pemdas.getEquation().length == 11) {
            // Length 11: Each equation is only two terms
            let term1 = pemdas.getEquation()[0];
            expect(term1).toBeLessThanOrEqual(200000);
            expect(term1).toBeGreaterThanOrEqual(10);
            let term2 = pemdas.getEquation()[2];
            expect(term2).toBeLessThanOrEqual(200000);
            expect(term2).toBeGreaterThanOrEqual(10);
            let term3 = pemdas.getEquation()[4];
            expect(term3).toBeLessThanOrEqual(200000);
            expect(term3).toBeGreaterThanOrEqual(10);
            let term4 = pemdas.getEquation()[6];
            expect(term4).toBeLessThanOrEqual(200000);
            expect(term4).toBeGreaterThanOrEqual(10);
            let term5 = pemdas.getEquation()[8];
            expect(term5).toBeLessThanOrEqual(200000);
            expect(term5).toBeGreaterThanOrEqual(10);
            let term6 = pemdas.getEquation()[10];
            expect(term6).toBeLessThanOrEqual(200000);
            expect(term6).toBeGreaterThanOrEqual(10);
            // Answer should be combined from equations
            let ans1;
            let ans2;
            let ans3;
            // Index 1 is mult div for first part
            if (pemdas.getEquation()[1] === "\u00D7") {
                ans1 = term1 * term2;
            } else {
                ans1 = term1 / term2;
            }
            // Index 5 is mult div for second part
            if (pemdas.getEquation()[5] === "\u00D7") {
                ans2 = term3 * term4;
            } else {
                ans2 = term3 / term4;
            }
            // Index 9 is mult div for third part
            if (pemdas.getEquation()[9] === "\u00D7") {
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
            // Print should be based on the bounds of the size
            const print = String(term1) + " x " + String(term2) + " x " + String(term3) + " x " + String(term4) + " x " + String(term5) + " x " + String(term6) + " = ?";
            expect(pemdas.getPrint().length).toBe(print.length);
        } else if (pemdas.getEquation().length == 13) {
            // Length 13, one equation has an extra term, total of 7 terms
            // 1 * 2 * 3 +- 4 */ 5 +- 6 */ 7 OR 1 */ 2 +- 3 * 4 * 5 +- 6 */ 7 OR 1 */ 2 +- 3 */ 4 +- 5 * 6 * 7
            let term1 = pemdas.getEquation()[0];
            expect(term1).toBeLessThanOrEqual(200000);
            expect(term1).toBeGreaterThanOrEqual(10);
            let term2 = pemdas.getEquation()[2];
            expect(term2).toBeLessThanOrEqual(200000);
            expect(term2).toBeGreaterThanOrEqual(10);
            let term3 = pemdas.getEquation()[4];
            expect(term3).toBeLessThanOrEqual(200000);
            expect(term3).toBeGreaterThanOrEqual(10);
            let term4 = pemdas.getEquation()[6];
            expect(term4).toBeLessThanOrEqual(200000);
            expect(term4).toBeGreaterThanOrEqual(10);
            let term5 = pemdas.getEquation()[8];
            expect(term5).toBeLessThanOrEqual(200000);
            expect(term5).toBeGreaterThanOrEqual(10);
            let term6 = pemdas.getEquation()[10];
            expect(term6).toBeLessThanOrEqual(200000);
            expect(term6).toBeGreaterThanOrEqual(10);
            let term7 = pemdas.getEquation()[12];
            expect(term7).toBeLessThanOrEqual(200000);
            expect(term7).toBeGreaterThanOrEqual(10);

            // Calculate answer -> find where the two term is, either add/sub is 3-4 and 5-6, 2-3 and 5-6, or 2-3, 4-5
            // first index is 2-3, index 3
            let firstIndex = false;
            if (pemdas.getEquation()[3] === "+" || pemdas.getEquation()[3] === "-") {
                firstIndex = true;
            }
            // second index is 3-4, index 5
            let secondIndex = false;
            if (pemdas.getEquation()[5] === "+" || pemdas.getEquation()[5] === "-") {
                secondIndex = true;
            }
            // third index is 4-5, index 7
            let thirdIndex = false;
            if (pemdas.getEquation()[7] === "+" || pemdas.getEquation()[7] === "-") {
                thirdIndex = true;
            }
            // fourth index is 5-6, index 9
            let fourthIndex = false;
            if (pemdas.getEquation()[9] === "+" || pemdas.getEquation()[9] === "-") {
                fourthIndex = true;
            }

            // Now split into 3 cases: second index fourth index, first index fourth index, first index third index

            if (secondIndex && fourthIndex) {
                // first equation is big
                let ans1 = term1 * term2 * term3;
                let ans2;
                let ans3;
                // ans2 at 4-5
                if (pemdas.getEquation()[7] === "\u00D7") {
                    ans2 = term4 * term5;
                } else {
                    ans2 = term4 / term5;
                }
                // ans3 at 6-7
                if (pemdas.getEquation()[11] === "\u00D7") {
                    ans3 = term6 * term7;
                } else {
                    ans3 = term6 / term7;
                }
                // addsub at 3-4 and 5-6
                let first;
                let final;
                // Index 5 is add sub for first two parts
                if (pemdas.getEquation()[5] === "+") {
                    first = ans1 + ans2;
                } else {
                    first = ans1 - ans2;
                }
                // Index 9 is add sub for full ans
                if (pemdas.getEquation()[9] === "+") {
                    final = first + ans3;
                } else {
                    final = first - ans3;
                }
                expect(pemdas.getAnswer()).toBe(final);
            } else if (firstIndex && fourthIndex) {
                // second equation is big
                let ans1;
                let ans2 = term3 * term4 * term5;
                let ans3;
                // ans1 at 1-2
                if (pemdas.getEquation()[1] === "\u00D7") {
                    ans1 = term1 * term2;
                } else {
                    ans1 = term1 / term2;
                }
                // ans3 at 6-7
                if (pemdas.getEquation()[11] === "\u00D7") {
                    ans3 = term6 * term7;
                } else {
                    ans3 = term6 / term7;
                }
                // addsub at 2-3 and 5-6
                let first;
                let final;
                // Index 3 is add sub for first two parts
                if (pemdas.getEquation()[3] === "+") {
                    first = ans1 + ans2;
                } else {
                    first = ans1 - ans2;
                }
                // Index 9 is add sub for full ans
                if (pemdas.getEquation()[9] === "+") {
                    final = first + ans3;
                } else {
                    final = first - ans3;
                }
                expect(pemdas.getAnswer()).toBe(final);
            } else if (firstIndex && thirdIndex) {
                // third equation is big
                let ans1;
                let ans2;
                let ans3 = term5 * term6 * term7;
                // ans1 at 1-2
                if (pemdas.getEquation()[1] === "\u00D7") {
                    ans1 = term1 * term2;
                } else {
                    ans1 = term1 / term2;
                }
                // ans2 at 3-4
                if (pemdas.getEquation()[5] === "\u00D7") {
                    ans2 = term3 * term4;
                } else {
                    ans2 = term3 / term4;
                }
                // addsub at 2-3 and 4-5
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
            } else {
                throw Error("Pemdas broken");
            }
            // Print should be based on the bounds of the size
            const print =   String(term1) + " x " + String(term2) + " x " + String(term3) + " x " + 
                            String(term4) + " x " + String(term5) + " x " + String(term6) + " x " +
                            String(term7) + " = ?";
            expect(pemdas.getPrint().length).toBe(print.length);
        } else if (pemdas.getEquation().length == 15) {
            // Length 15, two equations have an extra term, total of 8 terms
            // 1 * 2 * 3 +- 4 * 5 * 6 +- 7 */8 OR 1 * 2 * 3 +- 4 */ 5 +- 6 * 7 * 8 OR 1 */ 2 +- 3 * 4 * 5 +- 6 * 7 * 8
            let term1 = pemdas.getEquation()[0];
            expect(term1).toBeLessThanOrEqual(200000);
            expect(term1).toBeGreaterThanOrEqual(10);
            let term2 = pemdas.getEquation()[2];
            expect(term2).toBeLessThanOrEqual(200000);
            expect(term2).toBeGreaterThanOrEqual(10);
            let term3 = pemdas.getEquation()[4];
            expect(term3).toBeLessThanOrEqual(200000);
            expect(term3).toBeGreaterThanOrEqual(10);
            let term4 = pemdas.getEquation()[6];
            expect(term4).toBeLessThanOrEqual(200000);
            expect(term4).toBeGreaterThanOrEqual(10);
            let term5 = pemdas.getEquation()[8];
            expect(term5).toBeLessThanOrEqual(200000);
            expect(term5).toBeGreaterThanOrEqual(10);
            let term6 = pemdas.getEquation()[10];
            expect(term6).toBeLessThanOrEqual(200000);
            expect(term6).toBeGreaterThanOrEqual(10);
            let term7 = pemdas.getEquation()[12];
            expect(term7).toBeLessThanOrEqual(200000);
            expect(term7).toBeGreaterThanOrEqual(10);
            let term8 = pemdas.getEquation()[14];
            expect(term8).toBeLessThanOrEqual(200000);
            expect(term8).toBeGreaterThanOrEqual(10);
            // Calculate answer -> find where the two term is, either add/sub is 3-4 and 6-7, 3-4 and 5-6, or 2-3, 5-6
            // first index is 2-3, index 3
            let firstIndex = false;
            if (pemdas.getEquation()[3] === "+" || pemdas.getEquation()[3] === "-") {
                firstIndex = true;
            }
            // second index is 3-4, index 5
            let secondIndex = false;
            if (pemdas.getEquation()[5] === "+" || pemdas.getEquation()[5] === "-") {
                secondIndex = true;
            }
            // third index is 5-6, index 9
            let thirdIndex = false;
            if (pemdas.getEquation()[9] === "+" || pemdas.getEquation()[9] === "-") {
                thirdIndex = true;
            }
            // fourth index is 6-7, index 11
            let fourthIndex = false;
            if (pemdas.getEquation()[11] === "+" || pemdas.getEquation()[11] === "-") {
                fourthIndex = true;
            }
            // Now split into 3 cases: second index fourth index, second index third index, first index third index
            if (secondIndex && fourthIndex) {
                // first two equations are big
                let ans1 = term1 * term2 * term3;
                let ans2 = term4 * term5 * term6;
                let ans3;
                if (pemdas.getEquation()[13] === "\u00D7") {
                    ans3 = term7 * term8;
                } else {
                    ans3 = term7 / term8;
                }
                // addsub at 3-4 and 6-7
                let first;
                let final;
                // Index 5 is add sub for first two parts
                if (pemdas.getEquation()[5] === "+") {
                    first = ans1 + ans2;
                } else {
                    first = ans1 - ans2;
                }
                // Index 11 is add sub for full ans
                if (pemdas.getEquation()[11] === "+") {
                    final = first + ans3;
                } else {
                    final = first - ans3;
                }
                expect(pemdas.getAnswer()).toBe(final);
            } else if (secondIndex && thirdIndex) {
                // first and third equation are big
                let ans1 = term1 * term2 * term3;
                let ans2;
                let ans3 = term6 * term7 * term8;
                if (pemdas.getEquation()[7] === "\u00D7") {
                    ans2 = term4 * term5;
                } else {
                    ans2 = term4 / term5;
                }
                // addsub at 3-4 and 5-6
                let first;
                let final;
                // Index 5 is add sub for first two parts
                if (pemdas.getEquation()[5] === "+") {
                    first = ans1 + ans2;
                } else {
                    first = ans1 - ans2;
                }
                // Index 9 is add sub for full ans
                if (pemdas.getEquation()[9] === "+") {
                    final = first + ans3;
                } else {
                    final = first - ans3;
                }
                expect(pemdas.getAnswer()).toBe(final);
            } else if (firstIndex && thirdIndex) {
                // last two equations are big
                let ans1;
                let ans2 = term3 * term4 * term5;
                let ans3 = term6 * term7 * term8;
                if (pemdas.getEquation()[1] === "\u00D7") {
                    ans1 = term1 * term2;
                } else {
                    ans1 = term1 / term2;
                }
                // addsub at 2-3 and 5-6
                let first;
                let final;
                // Index 3 is add sub for first two parts
                if (pemdas.getEquation()[3] === "+") {
                    first = ans1 + ans2;
                } else {
                    first = ans1 - ans2;
                }
                // Index 9 is add sub for full ans
                if (pemdas.getEquation()[9] === "+") {
                    final = first + ans3;
                } else {
                    final = first - ans3;
                }
                expect(pemdas.getAnswer()).toBe(final);
            } else {
                throw Error("Pemdas broken");
            }
            // Print should be based on the bounds of the size
            const print =   String(term1) + " x " + String(term2) + " x " + String(term3) + " x " + 
                            String(term4) + " x " + String(term5) + " x " + String(term6) + " x " +
                            String(term7) + " x " + String(term8) + " = ?";
            expect(pemdas.getPrint().length).toBe(print.length);
        } else if (pemdas.getEquation().length == 17) {
            // Length 17, all equations have 3 terms, total of 9 terms
            // 1 * 2 * 3 +- 4 * 5 * 6 +- 7 * 8 * 9
            let term1 = pemdas.getEquation()[0];
            expect(term1).toBeLessThanOrEqual(100000);
            expect(term1).toBeGreaterThanOrEqual(10);
            let term2 = pemdas.getEquation()[2];
            expect(term2).toBeLessThanOrEqual(200000);
            expect(term2).toBeGreaterThanOrEqual(10);
            let term3 = pemdas.getEquation()[4];
            expect(term3).toBeLessThanOrEqual(200000);
            expect(term3).toBeGreaterThanOrEqual(10);
            let term4 = pemdas.getEquation()[6];
            expect(term4).toBeLessThanOrEqual(200000);
            expect(term4).toBeGreaterThanOrEqual(10);
            let term5 = pemdas.getEquation()[8];
            expect(term5).toBeLessThanOrEqual(200000);
            expect(term5).toBeGreaterThanOrEqual(10);
            let term6 = pemdas.getEquation()[10];
            expect(term6).toBeLessThanOrEqual(200000);
            expect(term6).toBeGreaterThanOrEqual(10);
            let term7 = pemdas.getEquation()[12];
            expect(term7).toBeLessThanOrEqual(200000);
            expect(term7).toBeGreaterThanOrEqual(10);
            let term8 = pemdas.getEquation()[14];
            expect(term8).toBeLessThanOrEqual(200000);
            expect(term8).toBeGreaterThanOrEqual(10);
            let term9 = pemdas.getEquation()[16];
            expect(term9).toBeLessThanOrEqual(200000);
            expect(term9).toBeGreaterThanOrEqual(10);
            // Calculate answer
            let ans1 = term1 * term2 * term3;
            let ans2 = term4 * term5 * term6;
            let ans3 = term7 * term8 * term9;

            let first;
            let final;
            // First addsub is between term 3 and 4
            if (pemdas.getEquation()[5] === "+") {
                first = ans1 + ans2;
            } else {
                first = ans1 - ans2;
            }
            // Second addsub is between term 6 and 7
            if (pemdas.getEquation()[11] === "+") {
                final = first + ans3;
            } else {
                final = first - ans3;
            }
            expect(pemdas.getAnswer()).toBe(final);
            // Print should be based on the bounds of the size
            const print =   String(term1) + " x " + String(term2) + " x " + String(term3) + " x " + 
                            String(term4) + " x " + String(term5) + " x " + String(term6) + " x " +
                            String(term7) + " x " + String(term8) + " x " + String(term9) + " = ?";
            expect(pemdas.getPrint().length).toBe(print.length);
            
        } else {
            throw Error("Pemdas broken");
        }
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
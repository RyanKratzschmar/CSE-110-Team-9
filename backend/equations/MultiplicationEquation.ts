// ProblemType1: multiplication with given factor sizes (e.g. 3-digit x 2-digit); extends RandomEquation. (Oliver)

import { RandomEquation } from "./RandomEquation";

export class MultiplicationEquation extends RandomEquation{

    private symbol = "\u00D7";

    constructor(difficulty: number, equation?: Array<any>, answer?: number) {
        // Start by calling super
        super(difficulty, equation, answer);

        // Sets type regardless
        this.type = "Multiplication";

        // Dont do the rest if there is an equation and answer provided
        if (equation !== null && equation !== undefined && answer !== null && answer !== undefined) {
            return;
        }

        if (difficulty >= 0) {
            // Difficulty determines the size of terms (one extra digit every 20 difficulty)

            // Difficulty determines the size of each term
            let lowerBoundOne = 0;
            let upperBoundOne = 100;

            let lowerBoundTwo = 0;
            let upperBoundTwo = 100;

            for (let i = 0; i < difficulty; i++) {
                if ((i%2) == 0) {
                    lowerBoundOne = lowerBoundOne + 100;
                    upperBoundOne = upperBoundOne + 100;
                } else {
                    lowerBoundTwo = lowerBoundTwo + 100;
                    upperBoundTwo = upperBoundTwo + 100;
                }
            }
            
            // Generate both terms based on their bounds
            let termOne = this.generateNumber(lowerBoundOne, upperBoundOne);
            let termTwo = this.generateNumber(lowerBoundTwo, upperBoundTwo);

            // Input them into the equation
            this.equation = [termOne, this.symbol, termTwo];

            // Answer is equal to the product
            this.answer = termOne * termTwo;

            // print equation
            this.print = String(termOne) + " " + this.symbol + " " + String(termTwo) + " = ?"
        } else {
            // If difficulty less than zero, do a basic times table but with division
            // factorOne = x, factorTwo = y, product = z
            // Equation is x * y = z
            let factorOne = this.generateNumber(0,13);
            let factorTwo = this.generateNumber(0,13);
            let product = factorOne * factorTwo;

            // z is the answer
            this.answer = product;

            // store equation
            this.equation = [factorOne, this.symbol, factorTwo];

            // print equation
            this.print = String(factorOne) + " " + this.symbol + " " + String(factorTwo) + " = ?";
        }
    }
}
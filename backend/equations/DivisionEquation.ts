// ProblemType2: long division with given divisor/dividend sizes, with or without remainder; extends RandomEquation. (Oliver)

import { RandomEquation } from "./RandomEquation";

export class DivisionEquation extends RandomEquation{

    constructor(difficulty: number) {

        // Start by calling super
        super(difficulty);

        // Sets type regardless
        this.type = "Division";

        if (difficulty >= 0) {
            // Difficulty determines the size of the terms
            let lowerBound = 10;
            let upperBound = 100;

            // Divisor can be a 2 digit number
            let termTwo = this.generateNumber(lowerBound, upperBound);
            // Let the answer scale ~ linearly with difficulty
            // Every X difficulty, increase potential size by 1 and factor by 2
            let extraLength = Math.floor(difficulty / this.difficultyPerTerm);
            for (let i = 0; i < extraLength; i++) {
                lowerBound = lowerBound * 10;
                upperBound = upperBound * 20;
            }
            let quotient = this.generateNumber(lowerBound,upperBound);
            // Dividend size based on the size of the quotient and the answer
            let termOne = termTwo * quotient;

            // Answer is the quotient
            this.answer = quotient;

            // Equation stores the terms for the question
            this.equation = [termOne, "/", termTwo];

            // Print is the written question
            this.print = String(termOne) + "/" + String(termTwo) + "=?";
        } else {
            // If difficulty less than zero, do a basic times table but with division
            // factorOne = x, factorTwo = y, product = z
            // Equation is z / x = y
            let factorOne = this.generateNumber(1,13);
            let factorTwo = this.generateNumber(1,13);
            let product = factorOne * factorTwo;

            // y is the answer
            this.answer = factorTwo;

            // store equation
            this.equation = [product, "/", factorOne];

            // print equation
            this.print = String(product) + "/" + String(factorOne) + "=?";
        }
    }

}
// ProblemType1: multiplication with given factor sizes (e.g. 3-digit x 2-digit); extends RandomEquation. (Oliver)

import { RandomEquation } from "./RandomEquation";

export class MultiplicationEquation extends RandomEquation{

    constructor(difficulty: number) {
        // Start by calling super
        super(difficulty);

        // Sets type regardless
        this.type = "Multiplication";

        if (difficulty >= 0) {
            // Difficulty determines the number of terms (one extra term every X difficulty)
            let numExtraTerms = Math.floor(difficulty / this.difficultyPerTerm) + 1;

            // Difficulty determines the size of each term
            let lowerBound = 10;
            let upperBound = 1000;


            // TermOne size is 3 digits only if difficulty mod 25 > 13
            if ((difficulty % this.difficultyPerTerm) < (this.difficultyPerTerm / 2)) {
                upperBound = 100; 
            }
            
            // Put term one in the equation and set product equal to term one
            let termOne = this.generateNumber(lowerBound, upperBound);
            this.equation.push(termOne);
            let product = termOne;

            // Reset upperbound if it was changed
            upperBound = 1000;
            
            // Get the rest of the terms, multiplying product and storing in the equation
            for (let i = 0; i < numExtraTerms; i++) {
                let extraTerm = this.generateNumber(lowerBound, upperBound);
                this.equation.push("*");
                this.equation.push(extraTerm);
                product = product * extraTerm;
            }

            // Answer is equal to the product of all factors
            this.answer = product;

            // Print holds the string version of the equation
            let written = "";
            for (let i = 0; i < this.equation.length; i++) {
                written = written + String(this.equation[i]);
            }
            written = written + "=?";
            this.print = written;
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
            this.equation = [factorOne, "*", factorTwo];

            // print equation
            this.print = String(factorOne) + "*" + String(factorTwo) + "=?";
        }
    }
}
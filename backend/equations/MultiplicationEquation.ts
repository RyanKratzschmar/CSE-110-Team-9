// ProblemType1: multiplication with given factor sizes (e.g. 3-digit x 2-digit); extends RandomEquation. (Oliver)

import { RandomEquation } from "./RandomEquation";

export class MultiplicationEquation extends RandomEquation{

    constructor(fixed: boolean, print?: string, answer?: number, equation?: Array<any>) {

        // If fixed, will instantiate with given parameters
        super(fixed, print, answer, equation);
        // Sets type regardless
        this.type = "Multiplication";

        // If not fixed, wont be instantiated with parameters: Must fill out print, answer, equation
        if (!fixed) {
            // Get the two factors for basic multiplication. Two integers from 10-99 
            let factorOne = this.generateNumber(10, 100);
            let factorTwo = this.generateNumber(10, 100);

            // Answer is equal to the product of both factors
            this.answer = (factorOne * factorTwo);

            // Equation is an array holding factorOne, multiplication symbol, factorTwo
            this.equation = [factorOne, "*", factorTwo];

            // Print holds the string version of the equation
            this.print = String(factorOne) + " * " + String(factorTwo) + " = ";
        }
    }

}
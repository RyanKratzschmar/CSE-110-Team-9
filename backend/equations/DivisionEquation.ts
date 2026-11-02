// ProblemType2: long division with given divisor/dividend sizes, with or without remainder; extends RandomEquation. (Oliver)

import { RandomEquation } from "./RandomEquation";

export class DivisionEquation extends RandomEquation{

    constructor(fixed: boolean, print?: string, answer?: number, equation?: Array<any>) {

        // If fixed, will instantiate with given parameters
        super(fixed, print, answer, equation);
        // Sets type regardless
        this.type = "Division";

        // If not fixed, wont be instantiated with parameters: Must fill out print, answer, equation
        if (!fixed) {
            // Get the two factors for a basic multiplication equation
            let factorOne = this.generateNumber(10, 100);
            let factorTwo = this.generateNumber(10, 100);
            // Get the answer to that question
            let product = factorOne * factorTwo;

            // The division equation is simply a reworked multiplication equation - a*b=c can be c/b = a

            // Answer is equal to factorOne
            this.answer = factorOne;

            // Equation is an array holding product, division symbol, factorTwo
            this.equation = [product, "/", factorTwo];

            // Print holds the string version of the equation
            this.print = String(product) + " / " + String(factorTwo) + " = ";
        }
    }

}
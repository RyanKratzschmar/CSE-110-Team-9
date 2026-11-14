// ProblemType3: multi-step equation with a given number of terms and number range; extends RandomEquation. (Oliver)

import { MultiplicationEquation } from "./MultiplicationEquation";
import { DivisionEquation } from "./DivisionEquation";
import { RandomEquation } from "./RandomEquation";

export class MultiOperationEquation extends RandomEquation{

    constructor(difficulty: number) {

        if (difficulty < 0) {
            throw new Error('Negative difficulty for PEMDAS');
        }

        // Start by calling super
        super(difficulty);

        // Sets type regardless
        this.type = "Pemdas";

        // Term size is always between 1 and 2 digits
        let lowerBound = 1;
        let upperBound = 100;

        // Difficulty determines how many multiplication or division problems to chain together, an extra 1 per difficultyperterm

        let coinflip = Math.random();

        // Initially, add or subtract one mult/div from another
        let partOne;
        let partTwo;

        // Determine type of first part
        if (coinflip < 0.5) {
            partOne = new MultiplicationEquation(-1);
        } else {
            partOne = new DivisionEquation(-1);
        }
        
        // Determine type of second part
        coinflip = Math.random();
        if (coinflip < 0.5) {
            partTwo = new MultiplicationEquation(-1);
        } else {
            partTwo = new DivisionEquation(-1);
        }

        // Determine to add or subtract the two
        coinflip = Math.random();
        if (coinflip < 0.5) {
            this.add(partOne,partTwo);
        } else {
            this.subtract(partOne,partTwo);
        }

        // Chain on more parts if difficulty high enough (just 2 parts for the first 25 difficulties, then one more for each 25)
        while (difficulty > this.difficultyPerTerm) {
            // Determine sign of new equation
            let eq;
            coinflip = Math.random();
            if (coinflip < 0.5) {
                eq = new MultiplicationEquation(-1);
            } else {
                eq = new DivisionEquation(-1);
            }
            
            // Determine to add or subtract
            coinflip = Math.random();
            if (coinflip < 0.5) {
                this.add(this, eq);
            } else {
                this.subtract(this, eq);
            }

            // Lower difficulty by diffperterm
            difficulty = difficulty - this.difficultyPerTerm;
        }
    }

    // Add the two equations and store them in this equation
    add(first: RandomEquation, second: RandomEquation): void {
        // Get both equations' answers and add them
        let ans1 = first.getAnswer();
        let ans2 = second.getAnswer();
        let sum = ans1 + ans2;
        this.answer = sum;

        // Get both equations' array and combine them
        let eq1 = first.getEquation();
        let mid = ["+"];
        let eq2 = second.getEquation();
        let full = eq1.concat(mid,eq2);
        this.equation = full;

        // Get the print from the full array
        let written = "";
            for (const obj in full) {
                written = written + String(obj);
            }
        written = written + "=?";
        this.print = written;
    }

    // Subtract the two equations and store them in this equation
    subtract(first: RandomEquation, second: RandomEquation): void {
        // Get both equations' answers and subtract them
        let ans1 = first.getAnswer();
        let ans2 = second.getAnswer();
        let difference = ans1 - ans2;
        this.answer = difference;

        // Get both equations' array and combine them
        let eq1 = first.getEquation();
        let mid = ["-"];
        let eq2 = second.getEquation();
        let full = eq1.concat(mid,eq2);
        this.equation = full;

        // Get the print from the full array
        let written = "";
            for (const obj in full) {
                written = written + String(obj);
            }
        written = written + "=?";
        this.print = written;
    }
}

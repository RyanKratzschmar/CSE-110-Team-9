// RandomEquation (abstract class): base for every problem type: getEquation(), getAnswer(), getType(), checkAnswer(). (Oliver)

export abstract class RandomEquation {

    // The print will store the string representation of the equation, mainly for display purposes
    print!: string;
    // The type will store the type of equation it is, mainly used as reference for which wrong answer explanation to call
    type!: string;
    // The answer will store the answer to the equation, used to check submitted answers
    answer!: number;
    // The equation will store the equation in an array to be analyzed by testing [num, operator, num, operator, num, etc.]
    // Important to note that this will follow strict format rules
    equation!: Array<any>;

    // Constructor has two paths:
    // If fixed, then constructs an equation from given parameters (assumes that inputted values are correct for testing purposes)
    // If not fixed, then constructs a random equation - implemented separately in each concrete implementation
    constructor(fixed: boolean, print?: string, answer?: number, equation?: Array<any>) {
        if (fixed) {
            // This should be pretty difficult to break, assume user best judgement (this case mainly used only for testing)
            this.print = String(print);
            this.answer = Number(answer);
            this.equation = Array<any>(equation);
        }
        // ELSE IMPLEMENTED IN THE CONCRETE IMPLEMENTATIONS
    }

    // Returns the equation as a string to print out
    getPrint(): string {
        return this.print;
    }

    // Returns the answer to the equation
    getAnswer(): number {
        return this.answer;
    }

    // Returns the type of equation
    getType(): string {
        return this.type;
    }

    // Returns the equation as an array to test
    getEquation(): Array<any> {
        return this.equation;
    }

    // Returns whether a given number is equivalent to the answer to the equation
    checkAnswer(submission: number): boolean {
        if (submission == this.answer) {
            return true;
        } else {
            return false;
        }
    }

    // Only visible to equation classes extending this one, generates a random number within a given range and with a given decimal length
    protected generateNumber(startRange: number, endRange: number, decimalDigits?: number): number {

        if (startRange >= endRange) {
            // Check the case where it was called incorrectly by a subclass
            throw new Error("Called generateNumber with the startRange being at or larger than the endRange. Bad.")
        }

        // Gets a random number from 0 to 1
        let random = Math.random();

        // Scales that number to be from 0 to (endRange-startRange)
        random = random * (endRange - startRange);

        // Increases that number to be from startRange to endRange
        random = random + startRange;

        // Rounds the number to the given decimal place (only if that parameter is included, assume never negative)
        if (decimalDigits === undefined) {
            random = Number(random.toFixed());
        } else {
            if (decimalDigits < 0) {
                // Check weird edge case that should not happen
                throw new Error("Called generateNumber with a negative amount of decimals. Bad.")
            }
            random = Number(random.toFixed(decimalDigits));
        }
        
        // Returns the random number
        return random;
    }
}
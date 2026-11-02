import {
    assertWholeNumber,
    BaseHint,
    digitsLeastFirst,
    plural,
    type HintStep,
} from './hint';

export class LongMultiplicationHint extends BaseHint {
    readonly operation = 'long-multiplication' as const;
    readonly operatorSymbol = '×' as const;
    readonly operands: readonly [number, number];
    readonly multiplicand: number;
    readonly multiplier: number;

    private readonly multiplicandDigits: readonly number[];
    private readonly multiplierDigits: readonly number[];

    constructor(multiplicand: number, multiplier: number) {
        super();
        assertWholeNumber(multiplicand, 'multiplicand');
        assertWholeNumber(multiplier, 'multiplier');

        this.multiplicand = multiplicand;
        this.multiplier = multiplier;
        this.operands = [multiplicand, multiplier];
        this.multiplicandDigits = digitsLeastFirst(multiplicand);
        this.multiplierDigits = digitsLeastFirst(multiplier);
    }

    protected buildSteps(): HintStep[] {
        const a = this.multiplicand;
        const b = this.multiplier;
        const bDigits = this.multiplierDigits;
        const numRows = bDigits.length;

        const steps: HintStep[] = [];

        // Step 1: Set up
        steps.push({
            stepNumber: 1,
            title: 'Set up and align by place value',
            description: `Write ${a} on top and ${b} below, aligning the ones digits on the right.`,
            details: [
                `The top number is ${a} and the bottom number is ${b}.`,
                numRows > 1
                    ? `The bottom number has ${plural(numRows, 'digit')}, so you will calculate ${numRows} partial product rows and add them together.`
                    : `${b} has 1 digit, so you only need a single row of multiplication.`,
                'Keep all columns straight and neatly aligned from right to left.',
            ],
            tip: 'Always align numbers to the right so ones line up with ones, and tens line up with tens!',
        });

        // Step 2: Multiply by ones digit
        const onesDigit = bDigits[0];
        const rightmostTop = this.multiplicandDigits[0];
        const initialProduct = onesDigit * rightmostTop;
        steps.push({
            stepNumber: 2,
            title: `Multiply by the ones digit (${onesDigit})`,
            description: `Multiply each digit of the top number (${a}) by ${onesDigit}, starting with the ones place (${rightmostTop}).`,
            details: [
                `First multiplication: ${onesDigit} × ${rightmostTop} = ${initialProduct}.`,
                initialProduct >= 10
                    ? `Since ${initialProduct} ≥ 10, write down ${initialProduct % 10} in the ones column and carry ${Math.floor(initialProduct / 10)} above the next digit!`
                    : `Write down ${initialProduct} in the ones column below the line.`,
                'Continue multiplying the other digits of the top number from right to left, adding any carried numbers after multiplying.',
            ],
            tip: 'Remember to multiply first, then add the carried amount (never add the carry before multiplying)!',
        });

        // Step 3 (if applicable): Multi-digit multiplier placeholder zero
        if (numRows > 1) {
            const tensDigit = bDigits[1];
            steps.push({
                stepNumber: 3,
                title: `Move to the tens digit (${tensDigit}) & write a placeholder zero`,
                description: `Before multiplying by ${tensDigit}, put a 0 (placeholder zero) in the ones column of the next row.`,
                details: [
                    `The digit ${tensDigit} is in the tens place, which means it represents ${tensDigit * 10}.`,
                    `Writing a '0' placeholder shifts your work to the left where tens belong.`,
                    `Then multiply ${a} by ${tensDigit} just like before, working from right to left.`,
                ],
                tip: 'Every time you move to the next place value on the bottom, add another placeholder zero (1 zero for tens, 2 zeros for hundreds)!',
            });

            // Step 4: Add partial products
            steps.push({
                stepNumber: 4,
                title: 'Add the partial products together',
                description: 'Draw an addition line under your partial products and add them together column by column.',
                details: [
                    'Start adding from the ones column on the far right.',
                    'If a column adds up to 10 or more, write the ones digit and carry the tens to the next column to the left.',
                    'The resulting sum is your final answer!',
                ],
                tip: 'Double-check each addition column carefully to avoid simple arithmetic mistakes.',
            });
        } else {
            // Single-digit multiplier wrap-up
            steps.push({
                stepNumber: 3,
                title: 'Complete the multiplication',
                description: `Multiply the remaining digits of ${a} by ${onesDigit} to find your answer.`,
                details: [
                    'Move to the next digit to the left and multiply.',
                    'Add any number you carried from the previous step.',
                    'Once all digits are multiplied, write down the final result!',
                ],
                tip: 'On the very last digit, write down the entire number (including the tens digit) without carrying.',
            });
        }

        return steps;
    }
}

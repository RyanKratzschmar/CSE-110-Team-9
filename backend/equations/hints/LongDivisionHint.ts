import {
    assertWholeNumber,
    BaseHint,
    GridBuilder,
    type HintStep,
    type WorkLayout,
} from './hint';

export class LongDivisionHint extends BaseHint {
    readonly operation = 'long-division' as const;
    readonly operatorSymbol = '÷' as const;
    readonly operands: readonly [number, number];
    readonly dividend: number;
    readonly divisor: number;

    private readonly dividendDigits: readonly number[];
    private readonly startIndex: number;

    constructor(dividend: number, divisor: number) {
        super();
        assertWholeNumber(dividend, 'dividend');
        assertWholeNumber(divisor, 'divisor');

        if (divisor === 0) {
            throw new RangeError('divisor must be greater than 0.');
        }

        this.dividend = dividend;
        this.divisor = divisor;
        this.operands = [dividend, divisor];
        this.dividendDigits = String(dividend).split('').map(Number);
        this.startIndex = this.findStartIndex();
    }

    private findStartIndex(): number {
        let prefix = 0;
        for (let i = 0; i < this.dividendDigits.length; i++) {
            prefix = prefix * 10 + this.dividendDigits[i];
            if (prefix >= this.divisor) {
                return i;
            }
        }
        return Math.max(0, this.dividendDigits.length - 1);
    }

    protected buildSteps(): HintStep[] {
        const d = this.divisor;
        const n = this.dividend;
        const ds = this.dividendDigits;

        const steps: HintStep[] = [];

        // Step 1: Setup & DMSB Strategy
        steps.push({
            stepNumber: 1,
            title: 'Set up the bracket and remember DMSB',
            description: `Place ${n} (the dividend) inside the bracket and ${d} (the divisor) outside.`,
            details: [
                'Remember the 4-step division cycle: Does McDonalds Sell Burgers?',
                '1. Divide: How many times does the divisor fit into the current number?',
                '2. Multiply: Multiply that estimate by the divisor.',
                '3. Subtract: Subtract the result to find what is left over.',
                '4. Bring down: Bring down the next digit from inside the bracket and repeat!',
            ],
            tip: 'D-M-S-B (Divide, Multiply, Subtract, Bring down) is the secret to solving every long division problem!',
        });

        // Step 2: First quotient digit
        const firstPrefix = Number(ds.slice(0, this.startIndex + 1).join(''));
        const firstEstimate = Math.floor(firstPrefix / d);

        steps.push({
            stepNumber: 2,
            title: `Find your starting digits (Divide into ${firstPrefix})`,
            description: `Look at the first digits of ${n} from left to right until you have a number at least as large as ${d}.`,
            details: [
                this.startIndex === 0
                    ? `${d} goes into the first digit (${ds[0]}).`
                    : `${d} does not go into the first digit, so look at the first ${this.startIndex + 1} digits: ${firstPrefix}.`,
                `How many times does ${d} go into ${firstPrefix} without going over? (About ${firstEstimate} time${firstEstimate === 1 ? '' : 's'}).`,
                `Write your estimated digit above ${ds[this.startIndex]} in the quotient on top of the bracket.`,
            ],
            tip: 'The quotient digit always sits right above the last digit of the number you are dividing into!',
        });

        // Step 3: Multiply and Subtract
        const product = firstEstimate * d;
        const remainder = firstPrefix - product;

        steps.push({
            stepNumber: 3,
            title: 'Multiply, Subtract, and Check the Remainder',
            description: `Multiply your quotient digit by ${d} and subtract it from ${firstPrefix}.`,
            details: [
                `Multiply: ${firstEstimate} × ${d} = ${product}. Write this under ${firstPrefix}.`,
                `Subtract: ${firstPrefix} − ${product} = ${remainder}.`,
                `Crucial Check: Is ${remainder} smaller than ${d}? Yes!`,
                'If your remainder is equal to or bigger than the divisor, your estimate was too small.',
                'If you cannot subtract because the product is bigger than the number, your estimate was too large.',
            ],
            tip: 'Always check: Is Remainder < Divisor? If yes, your quotient digit is correct!',
        });

        // Step 4: Bring Down and Repeat
        if (this.startIndex < ds.length - 1) {
            const nextDigit = ds[this.startIndex + 1];
            const newPartial = remainder * 10 + nextDigit;
            steps.push({
                stepNumber: 4,
                title: 'Bring down the next digit and repeat',
                description: `Bring down the next digit (${nextDigit}) next to your remainder (${remainder}) to make ${newPartial}.`,
                details: [
                    `Your new number to divide is ${newPartial}.`,
                    `Now repeat the DMSB cycle: How many times does ${d} go into ${newPartial}?`,
                    'Keep repeating until all digits of the dividend have been brought down.',
                    'If the divisor goes into the new number 0 times, write a 0 in the quotient before bringing down the next digit!',
                ],
                tip: 'Never skip a 0 in the quotient—it is an important place value holder!',
            });
        } else {
            steps.push({
                stepNumber: 4,
                title: 'Check your division by multiplying',
                description: 'Once all digits are brought down, check your work.',
                details: [
                    'Multiply your quotient on top by the divisor outside.',
                    'Add any remainder.',
                    `If the result equals the dividend (${n}), your answer is 100% correct!`,
                ],
                tip: 'Quotient × Divisor + Remainder = Dividend.',
            });
        }

        return steps;
    }

    protected buildLayout(): WorkLayout {
        const g = new GridBuilder();
        const dText = String(this.divisor);
        const nText = String(this.dividend);
        const bracketCol = dText.length;
        const firstDividendCol = bracketCol + 1;
        const lastCol = firstDividendCol + nText.length - 1;

        // Divisor outside
        g.rightAligned(1, bracketCol - 1, dText, 'digit', 1);

        // Right bracket ')'
        g.cell({ row: 1, col: bracketCol, text: ')', kind: 'bracket', step: 1 });

        // Dividend inside
        g.rightAligned(1, lastCol, nText, 'digit', 1);

        // Horizontal line over dividend
        g.line({ row: 1, fromCol: bracketCol, toCol: lastCol, edge: 'top', step: 1, fromOffset: 0.55 });

        // Step 2: Show question mark above the starting quotient digit column
        const activeCol = firstDividendCol + this.startIndex;
        g.cell({ row: 0, col: activeCol, text: '?', kind: 'hint-highlight', step: 2 });

        // Step 3: Starter subtraction line under first partial
        const firstPrefix = Number(this.dividendDigits.slice(0, this.startIndex + 1).join(''));
        const estimate = Math.floor(firstPrefix / this.divisor);
        if (estimate > 0) {
            const product = estimate * this.divisor;
            const left = g.rightAligned(2, activeCol, String(product), 'digit', 3);
            g.cell({ row: 2, col: left - 1, text: '−', kind: 'symbol', step: 3 });
            g.line({ row: 2, fromCol: left - 1, toCol: activeCol, edge: 'bottom', step: 3 });
        }

        return g.build(lastCol + 1);
    }
}


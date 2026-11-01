import { assertWholeNumber, capitalize, digitsLeastFirst, GridBuilder, placeName, plural, WorkedSolutionBase, type ExplanationStep, type WorkLayout } from './wrongAnswerExplanation';

//Long Multiplication

//One row of the work: the multiplicand times a single digit of the multiplier
interface PartialProduct {
    readonly place: number;
    readonly digit: number;
    readonly value: number;
    readonly shiftedText: string;
    readonly carries: readonly number[];
    readonly details: readonly string[];
}

//The column-by-column addition of the partial products
interface AdditionWork {
    readonly details: readonly string[];
    readonly carries: readonly { col: number; carry: number }[];
}

//Explains a long multiplication problem step by step
export class LongMultiplicationExplanation extends WorkedSolutionBase {
    readonly operation = 'long-multiplication' as const;
    readonly operatorSymbol = '×' as const;
    readonly operands: readonly [number, number];
    readonly multiplicand: number;
    readonly multiplier: number;
    readonly answer: number;

    private readonly multiplicandDigits: readonly number[];
    private readonly partials: readonly PartialProduct[];
    private readonly addition: AdditionWork;

    //Checks the inputs are whole numbers with an exact product, then works out the partial products and the addition
    constructor(multiplicand: number, multiplier: number) {
        super();
        assertWholeNumber(multiplicand, 'multiplicand');
        assertWholeNumber(multiplier, 'multiplier');
        const product = multiplicand * multiplier;
        if (!Number.isSafeInteger(product)) {
            throw new RangeError(`${multiplicand} × ${multiplier} is too large to compute exactly.`);
        }
        this.multiplicand = multiplicand;
        this.multiplier = multiplier;
        this.operands = [multiplicand, multiplier];
        this.answer = product;
        this.multiplicandDigits = digitsLeastFirst(multiplicand);
        this.partials = digitsLeastFirst(multiplier).map((digit, place) => this.computePartial(digit, place));
        this.addition = this.partials.length > 1 ? this.computeAddition() : { details: [], carries: [] }; //Only needed when there is more than one row to add
    }

    //Multiplies the multiplicand by one digit of the multiplier, recording the carries and explanation lines
    private computePartial(digit: number, place: number): PartialProduct {
        const top = this.multiplicandDigits;
        const carries: number[] = [];
        const details: string[] = [];

        if (digit === 0) {
            details.push(place > 0 ? 'Anything times 0 is 0, so this whole row is just 0 (no placeholder zeros needed).' : 'Anything times 0 is 0, so this row is 0.');
        } else {
            let carry = 0;
            top.forEach((t, j) => {
                const total = digit * t + carry;
                const isLast = j === top.length - 1;

                let line = `${digit} × ${t}${carry > 0 ? ` + ${carry} carried` : ''} = ${total}`;

                if (!isLast && total >= 10) {
                    line += ` → write ${total % 10}, carry ${Math.floor(total / 10)}`;
                } else {
                    line += ` → write ${total}`;
                }
                details.push(line);

                if (!isLast) {
                    carry = Math.floor(total / 10);
                    carries.push(carry);
                }
            });
        }

        const value = this.multiplicand * digit;
        const shiftedText = digit === 0 ? '0' : String(value) + '0'.repeat(place); //A row of 0 is written as a single 0
        if (digit !== 0) {
            details.push(place > 0 ? `Row: ${value} plus ${plural(place, 'placeholder zero')} → ${shiftedText}` : `Row: ${value}`);
        }

        return { place, digit, value, shiftedText, carries, details };
    }

    //Adds the partial products column by column, recording the carries and explanation lines
    private computeAddition(): AdditionWork {
        const texts = this.partials.map((p) => p.shiftedText);
        const width = Math.max(...texts.map((t) => t.length));
        const details: string[] = [];
        const carries: { col: number; carry: number }[] = [];
        let carry = 0;

        for (let col = 0; col < width; col++) {
            const digits = texts.filter((t) => t.length > col).map((t) => Number(t.charAt(t.length - 1 - col)));
            const sum = digits.reduce((a, b) => a + b, 0) + carry;
            const isLast = col === width - 1;

            let line = `${capitalize(placeName(col))}: ${digits.join(' + ')}${carry > 0 ? ` + ${carry} carried` : ''} = ${sum}`;
            if (!isLast && sum >= 10) {
                line += ` → write ${sum % 10}, carry ${Math.floor(sum / 10)}`;
            } else {
                line += ` → write ${sum}`;
            }
            details.push(line);

            if (!isLast) {
                carry = Math.floor(sum / 10);
                if (carry > 0) {
                    carries.push({ col: col + 1, carry });
                }
            }
        }
        return { details, carries };
    }

    //The step number of the final "add the partial products" step
    private get additionStepIndex(): number {
        return this.partials.length + 1;
    }

    //Writes the set-up step, one step per partial product, and an addition step when there is more than one row
    protected buildSteps(): ExplanationStep[] {
        const a = this.multiplicand;
        const b = this.multiplier;
        const steps: ExplanationStep[] = [{ title: 'Set up the problem', description: `Write ${a} on top and ${b} underneath, lining up the ones digits.`, details: this.partials.length > 1 ? [`Multiply ${a} by each digit of ${b}, starting with the ones digit.`, 'Each digit gives one row (a partial product). Add the rows at the end.'] : [`${b} has one digit, so a single row of multiplying gives the answer.`]}];
        
        for (const p of this.partials) {
            const worth = p.digit * 10 ** p.place;
            let description: string;
            if (p.place === 0) {
                description = `Multiply ${a} by ${p.digit}, the ones digit of ${b}, working from right to left.`;
            } else if (p.digit === 0) {
                description = `The 0 is in the ${placeName(p.place)} place, so this whole row is 0.`;
            } else {
                description = `The ${p.digit} is in the ${placeName(p.place)} place, so it is worth ${worth}. Write ${plural(p.place, 'placeholder zero')} on the right first, then multiply ${a} by ${p.digit}.`;
            }
            steps.push({title: `Multiply by the ${placeName(p.place)} digit (${p.digit})`, description, details: this.partials.length === 1 ? [...p.details, `${a} × ${b} = ${this.answer}`] : p.details});
        }

        if (this.partials.length > 1) {
            steps.push({title: 'Add the partial products', description: `Add ${this.partials.map((p) => p.shiftedText).join(' + ')} column by column, starting with the ones column.`, details: [...this.addition.details, `${a} × ${b} = ${this.answer}`]});
        }

        return steps;
    }

    //Lays out the two numbers, the partial products, the carries and the final answer on the grid
    protected buildLayout(): WorkLayout {
        const g = new GridBuilder();
        const aText = String(this.multiplicand);
        const bText = String(this.multiplier);
        const pText = String(this.answer);
        const m = this.partials.length;
        const widestPartial = Math.max(...this.partials.map((p) => p.shiftedText.length));
        const R = Math.max(aText.length, bText.length, pText.length, widestPartial);

        g.rightAligned(1, R, aText, 'digit', 0);
        g.rightAligned(2, R, bText, 'digit', 0);
        g.cell({row: 2, col: R - Math.max(aText.length, bText.length), text: '×', kind: 'symbol', step: 0});
        g.line({row: 2, fromCol: 0, toCol: R, edge: 'bottom', step: 0});

        this.partials.forEach((p, i) => {
            const row = 3 + i;
            const step = i + 1;

            if (p.digit === 0) {
                g.cell({row, col: R, text: '0', kind: 'digit', step}); //A row of 0 is a single 0 in the ones column
                return;
            }

            g.rightAligned(row, R - i, String(p.value), 'digit', step);

            for (let z = 0; z < i; z++) {
                g.cell({row, col: R - z, text: '0', kind: 'placeholder', step});
            }

            p.carries.forEach((carry, j) => {
                if (carry > 0) {
                    g.cell({row: 0, col: R - (j + 1), text: String(carry), kind: 'carry', step, transient: true});
                }
            });
        });

        if (m > 1) {
            const step = this.additionStepIndex;
            const lastPartialRow = 3 + m - 1;
            g.cell({row: lastPartialRow, col: R - widestPartial, text: '+', kind: 'symbol', step});
            g.line({row: lastPartialRow, fromCol: 0, toCol: R, edge: 'bottom', step});
            g.rightAligned(3 + m, R, pText, 'digit', step);
            for (const { col, carry } of this.addition.carries) {
                g.cell({row: 0, col: R - col, text: String(carry), kind: 'carry', step, transient: true});
            }
        }
        
        return g.build(R + 1);
    }
}
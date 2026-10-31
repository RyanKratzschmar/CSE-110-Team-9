import { assertWholeNumber, GridBuilder, placeName, plural, WorkedSolutionBase, type ExplanationStep, type WorkLayout } from './wrongAnswerExplanationPopUp';

//Long Division

interface DivisionStage {
    readonly digitIndex: number;
    readonly partial: number;
    readonly broughtDown: number | null;
    readonly quotientDigit: number;
    readonly product: number;
    readonly remainder: number;
}

export class LongDivisionExplanation extends WorkedSolutionBase {
    readonly operation = 'long-division' as const;
    readonly operatorSymbol = '÷' as const;
    readonly operands: readonly [number, number];
    readonly dividend: number;
    readonly divisor: number;
    readonly answer: number;

    private readonly dividendDigits: readonly number[];
    private readonly startIndex: number;
    private readonly stages: readonly DivisionStage[];

    constructor(dividend: number, divisor: number) {
        super();
        assertWholeNumber(dividend, 'dividend');
        assertWholeNumber(divisor, 'divisor');
        
        if (divisor === 0) {
            throw new RangeError('divisor must be greater than 0.');
        }

        if (dividend % divisor !== 0) {
            throw new RangeError(`${dividend} ÷ ${divisor} leaves a remainder of ${dividend % divisor}. Only exact division is supported for now.`);
        }

        this.dividend = dividend;
        this.divisor = divisor;
        this.operands = [dividend, divisor];
        this.answer = dividend / divisor;
        this.dividendDigits = String(dividend).split('').map(Number);
        this.startIndex = this.findStartIndex();
        this.stages = this.computeStages();
    }

    private findStartIndex(): number {
        let prefix = 0;
        for (let i = 0; i < this.dividendDigits.length; i++) {
            prefix = prefix * 10 + this.dividendDigits[i];
            if (prefix >= this.divisor) {
                return i;
            }
        }
        return this.dividendDigits.length - 1;
    }

    private computeStages(): DivisionStage[] {
        const ds = this.dividendDigits;
        const stages: DivisionStage[] = [];
        let partial = Number(ds.slice(0, this.startIndex + 1).join(''));
        let remainder = 0;

        for (let i = this.startIndex; i < ds.length; i++) {
            const broughtDown = i > this.startIndex ? ds[i] : null;
            
            if (broughtDown !== null) {
                partial = remainder * 10 + broughtDown;
            }
            
            const quotientDigit = Math.floor(partial / this.divisor);
            const product = quotientDigit * this.divisor;
            remainder = partial - product;
            stages.push({ digitIndex: i, partial, broughtDown, quotientDigit, product, remainder });
        }
        
        return stages;
    }

    private quotientPlace(digitIndex: number): number {
        return this.dividendDigits.length - 1 - digitIndex;
    }

    protected buildSteps(): ExplanationStep[] {
        const d = this.divisor;
        const ds = this.dividendDigits;
        const first = this.stages[0];

        const setupDetails = [`${d} is the divisor (outside the bracket); ${this.dividend} is the dividend (inside).`];
        
        if (this.dividend === 0) {
            setupDetails.push('0 divided by any number is 0.');
        } else if (this.startIndex > 0) {
            const tooSmall = Number(ds.slice(0, this.startIndex).join(''));
            setupDetails.push(`${d} does not go into ${tooSmall}, so start with the first ${this.startIndex + 1} digits: ${first.partial}.`);
        } else {
            setupDetails.push(`${d} goes into ${first.partial}, so start with the first digit.`);
        }

        const steps: ExplanationStep[] = [{title: 'Set up the problem', description: `Write ${this.dividend} inside the division bracket and ${d} outside. Work through ${this.dividend} from left to right.`, details: setupDetails}];

        for (const st of this.stages) {
            const above = ds[st.digitIndex];
            const place = placeName(this.quotientPlace(st.digitIndex));
            const details: string[] = [];
            
            if (st.broughtDown !== null) {
                details.push(`Bring down the next digit, ${st.broughtDown}, to make ${st.partial}.`);
            }

            if (st.quotientDigit > 0) {
                const q = st.quotientDigit;
                details.push(`${q} × ${d} = ${st.product}` + (q < 9 ? `, and ${q + 1} × ${d} = ${(q + 1) * d} is too big.` : '.'));
                details.push(`Subtract: ${st.partial} − ${st.product} = ${st.remainder}.`);
                details.push(`${st.remainder} is less than ${d}, so ${q} is the right digit.`);
                steps.push({title: `Divide ${st.partial} by ${d}`, description: `${d} goes into ${st.partial} ${plural(q, 'time')}. Write ${q} in the quotient above the ${above} (the ${place} place).`, details});
            } else {
                details.push(`${d} is already bigger than ${st.partial}, so ${d} goes into it 0 times.`);
                details.push('Write 0 in the quotient and keep going.');
                const zeroNote = this.dividend === 0 ? '' : ` Don't skip this zero: it holds the ${place} place.`; //When the dividend is 0, this 0 is the whole answer, not a placeholder
                steps.push({title: `Divide ${st.partial} by ${d}`, description: `${d} does not go into ${st.partial}, so write 0 in the quotient above the ${above}.` + zeroNote, details});
            }
        }

        steps.push({title: 'Check by multiplying', description: `Multiply the quotient by the divisor: ${this.answer} × ${d} = ${this.dividend}. It matches the dividend, so ${this.dividend} ÷ ${d} = ${this.answer}.`, details: []});

        return steps;
    }

    protected buildLayout(): WorkLayout {
        const g = new GridBuilder();
        const dText = String(this.divisor);
        const nText = String(this.dividend);
        const bracketCol = dText.length;
        const firstDividendCol = bracketCol + 1;
        const lastCol = firstDividendCol + nText.length - 1;

        g.rightAligned(1, bracketCol - 1, dText, 'digit', 0);
        g.cell({row: 1, col: bracketCol, text: ')', kind: 'bracket', step: 0});
        g.rightAligned(1, lastCol, nText, 'digit', 0);
        g.line({row: 1, fromCol: bracketCol, toCol: lastCol, edge: 'top', step: 0, fromOffset: 0.55});

        let partialRow = 1;
        let nextRow = 2;
        this.stages.forEach((st, k) => {
            const step = k + 1;
            const col = firstDividendCol + st.digitIndex;
            const isLast = k === this.stages.length - 1;

            if (st.broughtDown !== null) {
                g.cell({row: partialRow, col, text: String(st.broughtDown), kind: 'digit', step});
            }

            g.cell({row: 0, col, text: String(st.quotientDigit), kind: 'digit', step});

            if (st.quotientDigit > 0) {
                const productRow = nextRow++;
                const left = g.rightAligned(productRow, col, String(st.product), 'digit', step);
                g.cell({row: productRow, col: left - 1, text: '−', kind: 'symbol', step});
                g.line({row: productRow, fromCol: left - 1, toCol: col, edge: 'bottom', step});

                const remainderRow = nextRow++;
                if (st.remainder > 0 || isLast) {
                    g.rightAligned(remainderRow, col, String(st.remainder), 'digit', step);
                }
                partialRow = remainderRow;
            }
        });

        return g.build(lastCol + 1);
    }
}
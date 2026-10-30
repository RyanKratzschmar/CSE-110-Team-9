export type OperationKind = 'long-multiplication' | 'long-division'; //Describes the kind of operation we are working with

export type CellKind = 'digit' | 'placeholder' | 'carry' | 'symbol' | 'bracket'; //Describes the type of cell that we are dealing with to differentiate the view styles

//Defines the properties for each cell
export interface WorkCell {
    readonly row: number;
    readonly col: number;
    readonly text: string;
    readonly kind: CellKind;
    readonly step: number; //Which step number does the given cell belong to
    readonly transient: boolean; //Controls how long a cell stays visible. When it is false, it implies that the given cell will show up for its own step and the steps that follow. (Applies to most cells) If this is true, then the given cell will only appear for its own step and will disappear afterwards. (Used for carry functionality)
}

//Defines the properties for a horizontal line in the written out work, such as the one under "x 12"
export interface WorkLine {
    readonly row: number;
    readonly fromCol: number;
    readonly toCol: number; //Inclusive
    readonly edge: 'top' | 'bottom';
    readonly step: number; //Which step number does the given line belong to
    readonly fromOffset: number; //Offsets the start of the line by a fraction between 0 and 1, so that we can start the line midway through a cell
}

//Stores the finished worked out grid solution
export interface WorkLayout {
    readonly rows: number;
    readonly columns: number;
    readonly cells: readonly WorkCell[];
    readonly lines: readonly WorkLine[];
}

//The text for one step of the explanation
export interface ExplanationStep {
    readonly title: string;
    readonly description: string;
    readonly details: readonly string[];
}

//Stores the finished worked out solution (grid + text) to a given problem
export interface WorkedSolution {
    readonly operation: OperationKind;
    readonly operands: readonly [number, number];
    readonly operatorSymbol: '×' | '÷';
    readonly problemText: string;
    readonly answer: number;
    readonly steps: readonly ExplanationStep[];
    readonly layout: WorkLayout;
}

//Anything that can produce a WorkedSolution (both explanation classes implement this)
export interface WrongAnswerExplainer {
    explain(): WorkedSolution;
}

const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions', 'ten-millions', 'hundred-millions', 'billions', 'ten-billions', 'hundred-billions', 'trillions', 'ten-trillions', 'hundred-trillions', 'quadrillions'];

//Function to get the place value name
export function placeName(power: number): string {
    return PLACE_NAMES[power] ?? `10^${power}`;
}

//Function to check a cell's visibility at a given step
export function isCellVisible(cell: WorkCell, step: number): boolean {
    return cell.transient ? cell.step === step : cell.step <= step; //If the cell is transient, it should only be displayed for its own step. If not, it should be displayed from its own step onwards.
}

//Function to capitalize the first letter of a string
function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

//Function to return the count with the word, pluralized if needed (1 time, 2 times)
function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

//Function that throws an error if a number is not a whole number
function assertWholeNumber(value: number, name: string): void {
    if ((!Number.isSafeInteger(value)) || (value < 0)) {
        throw new RangeError(`${name} must be a whole number (0 or more), got ${value}.`);
    }
}

//Function to split a number into its digits, ones digit first
function digitsLeastFirst(n: number): number[] {
    return String(n).split('').reverse().map(Number);
}

//Defines a WorkCell where transient is optional (defaults to false)
type CellInput = Omit<WorkCell, 'transient'> & { transient?: boolean };

//Defines a WorkLine where fromOffset is optional (defaults to 0)
type LineInput = Omit<WorkLine, 'fromOffset'> & { fromOffset?: number };

//Collects the cells and lines and works out the grid size from them
class GridBuilder {
    private readonly cells: WorkCell[] = [];
    private readonly lines: WorkLine[] = [];
    private maxRow = -1;
    private maxCol = -1;

    private track(row: number, col: number): void {
        this.maxRow = Math.max(this.maxRow, row);
        this.maxCol = Math.max(this.maxCol, col);
    }

    cell(cell: CellInput): void {
        this.cells.push({ ...cell, transient: cell.transient ?? false });
        this.track(cell.row, cell.col);
    }

    rightAligned(row: number, rightCol: number, text: string, kind: CellKind, step: number): number {
        const left = rightCol - text.length + 1;
        for (let i = 0; i < text.length; i++) {
            this.cell({row, col: left + i, text: text.charAt(i), kind, step});
        }
        return left;
    }

    line(line: LineInput): void {
        this.lines.push({ ...line, fromOffset: line.fromOffset ?? 0 });
        this.track(line.row, line.toCol);
    }

    build(minColumns = 0): WorkLayout {
        return {rows: this.maxRow + 1, columns: Math.max(this.maxCol + 1, minColumns), cells: this.cells, lines: this.lines };
    }
}

//Base Class for both explanation classes (Long Multiplication and Long Division)
abstract class WorkedSolutionBase implements WrongAnswerExplainer {
    abstract readonly operation: OperationKind;
    abstract readonly operands: readonly [number, number];
    abstract readonly operatorSymbol: '×' | '÷';
    abstract readonly answer: number;

    private cached: WorkedSolution | null = null;

    explain(): WorkedSolution {
        if (this.cached) {
            return this.cached;
        }
        const [left, right] = this.operands;
        this.cached = {operation: this.operation, operands: this.operands, operatorSymbol: this.operatorSymbol, problemText: `${left} ${this.operatorSymbol} ${right}`, answer: this.answer, steps: this.buildSteps(), layout: this.buildLayout()};
        return this.cached;
    }

    protected abstract buildSteps(): ExplanationStep[];
    protected abstract buildLayout(): WorkLayout;
}

//Long Multiplication

interface PartialProduct {
    readonly place: number;
    readonly digit: number;
    readonly value: number;
    readonly shiftedText: string;
    readonly carries: readonly number[];
    readonly details: readonly string[];
}

interface AdditionWork {
    readonly details: readonly string[];
    readonly carries: readonly { col: number; carry: number }[];
}

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

    private get additionStepIndex(): number {
        return this.partials.length + 1;
    }

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
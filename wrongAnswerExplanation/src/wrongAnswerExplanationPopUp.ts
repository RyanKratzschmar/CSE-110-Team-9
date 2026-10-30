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

const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions', 'ten-millions', 'hundred-millions', 'billions'];

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
function digitsLeastFirst(n: number) : number[] {
    return String(n).split('').reverse().map(Number);
}

//Defines a WorkCell where transient is optional (defaults to false)
type CellInput = Omit<WorkCell, 'transient'> & { transient?: boolean };

// Defines a WorkLine where fromOffset is optional (defaults to 0)
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
    readonly carries: readonly { col : number; carry: number }[];
}

export class LongMultiplicationExplanation extends WorkedSolutionBase {
    readonly operation = 'long-multiplication' as const;
    readonly operatorSymbol = '×' as const;
    readonly operands: readonly [number, number];
    readonly multiplicand: number;
    readonly multiplier: number;
    readonly answer: number;

    private readonly partials: readonly PartialProduct[];
    private readonly addition: AdditionWork;

    constructor (multiplicand: number, multiplier: number) {
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
        this.partials = digitsLeastFirst(multiplier).map((digit, place) => this.computePartial(digit, place));
        this.addition = this.computeAddition();
    }

    private computePartial(digit: number, place: number): PartialProduct {
        const top = digitsLeastFirst(this.multiplicand);
        const carries: number[] = [];
        const details: string[] = [];

        if (digit === 0) {
            details.push('Anything times 0 is 0, so this row is 0.');
        } else {
            let carry = 0;
            top.forEach((t, j) => {
                const total = digit*t + carry;
                const isLast = j === top.length - 1;

                let line = `${digit} × ${t}${carry > 0 ? ` + ${carry} carried` : ''} = ${total}`;

                if (!isLast && total >= 10) {
                    line += ` → write ${total % 10}, carry ${Math.floor(total / 10)}`;
                } else {
                    line += ` → write ${total}`;
                }
                details.push(line);

                if(!isLast) {
                    carry = Math.floor(total / 10);
                    carries.push(carry);
                }
            });
        }

        const value = this.multiplicand * digit;
        const shiftedText = String(value) + '0'.repeat(place);
        details.push(place > 0? `Row: ${value} plus ${plural(place, 'placeholder zero')} → ${shiftedText}`: `Row: ${value}`);

        return { place, digit, value, shiftedText, carries, details };
    }

    private computeAddition(): AdditionWork {
        const texts = this.partials.map((p) => p.shiftedText);
        const width = Math.max(...texts.map((t) => t.length));
        const details: string[] = [];
        const carries: { col: number; carry: number }[] =[];
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
                    carries.push({ col: col + 1, carry});
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
        const steps: ExplanationStep[] = [{ title: 'Set up the problem', description: `Write ${a} on top and ${b} underneath, lining up the ones digits.`, details: this.partials.length > 1? [`Multiply ${a} by each digit of ${b}, starting with the ones digit.`, 'Each digit gives one row (a partial product). Add the rows at the end.'] : [`${b} has one digit, so a single row of multiplying gives the answer.`]}];
        
        for (const p of this.partials) {
            const worth = p.digit * 10 ** p.place;
            steps.push({title: `Multiply by the ${placeName(p.place)} digit (${p.digit})`, description: p.place === 0? `Multiply ${a} by ${p.digit}, the ones digit of ${b}, working from right to left.` : `The ${p.digit} is in the ${placeName(p.place)} place, so it is worth ${worth}. ` + `Write ${plural(p.place, 'placeholder zero')} on the right first, then multiply ${a} by ${p.digit}.`, details: this.partials.length === 1 ? [...p.details, `${a} × ${b} = ${this.answer}`] : p.details});
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
            
            g.rightAligned(row, R - i, String(p.value), 'digit', step);

            for (let z = 0; z < i; z++) {
                g.cell({row: row, col: R - z, text: '0', kind: 'placeholder', step});
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
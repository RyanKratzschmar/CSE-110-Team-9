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
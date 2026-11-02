export type OperationKind = 'long-multiplication' | 'long-division';

export type CellKind = 'digit' | 'placeholder' | 'carry' | 'symbol' | 'bracket' | 'hint-highlight';

export interface WorkCell {
    readonly row: number;
    readonly col: number;
    readonly text: string;
    readonly kind: CellKind;
    readonly step: number;
    readonly transient: boolean;
}

export interface WorkLine {
    readonly row: number;
    readonly fromCol: number;
    readonly toCol: number;
    readonly edge: 'top' | 'bottom';
    readonly step: number;
    readonly fromOffset: number;
}

export interface WorkLayout {
    readonly rows: number;
    readonly columns: number;
    readonly cells: readonly WorkCell[];
    readonly lines: readonly WorkLine[];
}

export interface HintStep {
    readonly stepNumber: number;
    readonly title: string;
    readonly description: string;
    readonly details: readonly string[];
    readonly tip?: string;
}

export interface HintData {
    readonly operation: OperationKind;
    readonly operands: readonly [number, number];
    readonly operatorSymbol: '×' | '÷';
    readonly problemText: string;
    readonly steps: readonly HintStep[];
    readonly layout: WorkLayout;
}

export interface HintProvider {
    getHint(): HintData;
}

const PLACE_NAMES = [
    'ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands',
    'millions', 'ten-millions', 'hundred-millions', 'billions'
];

export function placeName(power: number): string {
    return PLACE_NAMES[power] ?? `10^${power}`;
}

export function isCellVisible(cell: WorkCell, step: number): boolean {
    return cell.transient ? cell.step === step : cell.step <= step;
}

export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export function assertWholeNumber(value: number, name: string): void {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new RangeError(`${name} must be a whole number (0 or more), got ${value}.`);
    }
}

export function digitsLeastFirst(n: number): number[] {
    return String(n).split('').reverse().map(Number);
}

type CellInput = Omit<WorkCell, 'transient'> & { transient?: boolean };
type LineInput = Omit<WorkLine, 'fromOffset'> & { fromOffset?: number };

export class GridBuilder {
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
            this.cell({ row, col: left + i, text: text.charAt(i), kind, step });
        }
        return left;
    }

    line(line: LineInput): void {
        this.lines.push({ ...line, fromOffset: line.fromOffset ?? 0 });
        this.track(line.row, line.toCol);
    }

    build(minColumns = 0): WorkLayout {
        return {
            rows: this.maxRow + 1,
            columns: Math.max(this.maxCol + 1, minColumns),
            cells: this.cells,
            lines: this.lines,
        };
    }
}

export abstract class BaseHint implements HintProvider {
    abstract readonly operation: OperationKind;
    abstract readonly operands: readonly [number, number];
    abstract readonly operatorSymbol: '×' | '÷';

    private cached: HintData | null = null;

    getHint(): HintData {
        if (this.cached) {
            return this.cached;
        }
        const [left, right] = this.operands;
        this.cached = {
            operation: this.operation,
            operands: this.operands,
            operatorSymbol: this.operatorSymbol,
            problemText: `${left} ${this.operatorSymbol} ${right}`,
            steps: this.buildSteps(),
            layout: this.buildLayout(),
        };
        return this.cached;
    }

    protected abstract buildSteps(): HintStep[];
    protected abstract buildLayout(): WorkLayout;
}


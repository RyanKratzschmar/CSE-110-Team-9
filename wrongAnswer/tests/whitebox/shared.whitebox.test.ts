import { describe, expect, it } from 'vitest';
import {
    assertWholeNumber,
    capitalize,
    digitsLeastFirst,
    GridBuilder,
    isCellVisible,
    placeName,
    plural,
    WorkedSolutionBase,
    type ExplanationStep,
    type WorkCell,
    type WorkLayout,
} from '../../../backend/equations/wrongAnswerExplanation/wrongAnswerExplanation';

function cell(step: number, transient: boolean): WorkCell {
    return { row: 0, col: 0, text: '1', kind: 'carry', step, transient };
}

describe('placeName', () => {
    it('names the known places', () => {
        expect(placeName(0)).toBe('ones');
        expect(placeName(1)).toBe('tens');
        expect(placeName(3)).toBe('thousands');
        expect(placeName(15)).toBe('quadrillions');
    });

    it('falls back to a power of ten past the end of the list', () => {
        expect(placeName(16)).toBe('10^16');
    });
});

describe('isCellVisible', () => {
    it('shows a non-transient cell from its own step onwards', () => {
        expect(isCellVisible(cell(2, false), 1)).toBe(false);
        expect(isCellVisible(cell(2, false), 2)).toBe(true);
        expect(isCellVisible(cell(2, false), 5)).toBe(true);
    });

    it('shows a transient cell only during its own step', () => {
        expect(isCellVisible(cell(2, true), 1)).toBe(false);
        expect(isCellVisible(cell(2, true), 2)).toBe(true);
        expect(isCellVisible(cell(2, true), 3)).toBe(false);
    });
});

describe('capitalize', () => {
    it('upper-cases only the first letter', () => {
        expect(capitalize('ten-thousands')).toBe('Ten-thousands');
    });

    it('handles an empty string', () => {
        expect(capitalize('')).toBe('');
    });
});

describe('plural', () => {
    it('uses the singular only for exactly 1', () => {
        expect(plural(1, 'time')).toBe('1 time');
        expect(plural(0, 'time')).toBe('0 times');
        expect(plural(2, 'placeholder zero')).toBe('2 placeholder zeros');
    });
});

describe('assertWholeNumber', () => {
    it.each([0, 1, Number.MAX_SAFE_INTEGER])('accepts %d', (value) => {
        expect(() => assertWholeNumber(value, 'n')).not.toThrow();
    });

    it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])('rejects %d', (value) => {
        expect(() => assertWholeNumber(value, 'n')).toThrow(`n must be a whole number (0 or more), got ${value}.`);
    });
});

describe('digitsLeastFirst', () => {
    it('lists digits starting with the ones digit', () => {
        expect(digitsLeastFirst(120)).toEqual([0, 2, 1]);
        expect(digitsLeastFirst(0)).toEqual([0]);
    });
});

describe('GridBuilder', () => {
    it('builds an empty layout with no rows, using minColumns for the width', () => {
        expect(new GridBuilder().build()).toEqual({ rows: 0, columns: 0, cells: [], lines: [] });
        expect(new GridBuilder().build(4).columns).toBe(4);
    });

    it('defaults transient to false and fromOffset to 0', () => {
        const g = new GridBuilder();
        g.cell({ row: 0, col: 0, text: '1', kind: 'digit', step: 0 });
        g.line({ row: 0, fromCol: 0, toCol: 0, edge: 'bottom', step: 0 });
        const layout = g.build();
        expect(layout.cells[0].transient).toBe(false);
        expect(layout.lines[0].fromOffset).toBe(0);
    });

    it('keeps explicit transient and fromOffset values', () => {
        const g = new GridBuilder();
        g.cell({ row: 0, col: 0, text: '1', kind: 'carry', step: 1, transient: true });
        g.line({ row: 0, fromCol: 0, toCol: 0, edge: 'top', step: 0, fromOffset: 0.55 });
        const layout = g.build();
        expect(layout.cells[0].transient).toBe(true);
        expect(layout.lines[0].fromOffset).toBe(0.55);
    });

    it('right-aligns text so its last character lands in rightCol, and returns the left column', () => {
        const g = new GridBuilder();
        expect(g.rightAligned(2, 5, '123', 'digit', 1)).toBe(3);
        expect(g.build().cells.map((c) => [c.row, c.col, c.text])).toEqual([[2, 3, '1'], [2, 4, '2'], [2, 5, '3']]);
    });

    it('grows the grid to fit both cells and lines', () => {
        const g = new GridBuilder();
        g.cell({ row: 1, col: 2, text: '1', kind: 'digit', step: 0 });
        g.line({ row: 4, fromCol: 0, toCol: 6, edge: 'bottom', step: 0 });
        const layout = g.build();
        expect(layout.rows).toBe(5);
        expect(layout.columns).toBe(7);
    });

    it('uses minColumns only when it is wider than the content', () => {
        const g = new GridBuilder();
        g.cell({ row: 0, col: 5, text: '1', kind: 'digit', step: 0 });
        expect(g.build(3).columns).toBe(6);
        expect(g.build(10).columns).toBe(10);
    });
});

describe('WorkedSolutionBase', () => {
    class CountingSolution extends WorkedSolutionBase {
        readonly operation = 'long-multiplication' as const;
        readonly operatorSymbol = '×' as const;
        readonly operands = [6, 7] as const;
        readonly answer = 42;
        stepBuilds = 0;
        layoutBuilds = 0;

        protected buildSteps(): ExplanationStep[] {
            this.stepBuilds++;
            return [];
        }

        protected buildLayout(): WorkLayout {
            this.layoutBuilds++;
            return new GridBuilder().build();
        }
    }

    it('builds the problem text from the operands and operator', () => {
        expect(new CountingSolution().explain().problemText).toBe('6 × 7');
    });

    it('builds the solution once and returns the cached object afterwards', () => {
        const solution = new CountingSolution();
        const first = solution.explain();
        expect(solution.explain()).toBe(first);
        expect(solution.stepBuilds).toBe(1);
        expect(solution.layoutBuilds).toBe(1);
    });
});

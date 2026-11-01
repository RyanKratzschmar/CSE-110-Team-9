import { describe, expect, it } from 'vitest';
import { LongDivisionExplanation } from '../../../backend/equations/wrongAnswerExplanation/src/LongDivisionExplanation';
import { LongMultiplicationExplanation } from '../../../backend/equations/wrongAnswerExplanation/src/LongMultiplicationExplanation';
import { isCellVisible, type WorkedSolution } from '../../../backend/equations/wrongAnswerExplanation/wrongAnswerExplanation';
import { rowText } from '../helpers';

const multiplications: [number, number][] = [];
for (let a = 0; a <= 1200; a += 97) {
    for (const b of [0, 1, 7, 10, 45, 102, 999, 4060]) {
        multiplications.push([a, b]);
    }
}

const divisions: [number, number][] = [];
for (let divisor = 1; divisor <= 25; divisor += 3) {
    for (const quotient of [0, 1, 9, 10, 102, 407, 1000, 3456]) {
        divisions.push([quotient * divisor, divisor]);
    }
}

const solutions: [string, WorkedSolution][] = [
    ...multiplications.map(([a, b]): [string, WorkedSolution] => [`${a} × ${b}`, new LongMultiplicationExplanation(a, b).explain()]),
    ...divisions.map(([n, d]): [string, WorkedSolution] => [`${n} ÷ ${d}`, new LongDivisionExplanation(n, d).explain()]),
];

describe('layout invariants for every explanation (gray box)', () => {
    it.each(solutions)('%s keeps every cell and line inside the grid', (_, { layout }) => {
        for (const cell of layout.cells) {
            expect(cell.row).toBeGreaterThanOrEqual(0);
            expect(cell.row).toBeLessThan(layout.rows);
            expect(cell.col).toBeGreaterThanOrEqual(0);
            expect(cell.col).toBeLessThan(layout.columns);
            expect(cell.text).toHaveLength(1);
        }
        for (const line of layout.lines) {
            expect(line.fromCol).toBeGreaterThanOrEqual(0);
            expect(line.toCol).toBeLessThan(layout.columns);
            expect(line.fromCol).toBeLessThanOrEqual(line.toCol);
            expect(line.fromOffset).toBeGreaterThanOrEqual(0);
            expect(line.fromOffset).toBeLessThan(1);
        }
    });

    it.each(solutions)('%s only uses step numbers that have a matching explanation step', (_, { layout, steps }) => {
        for (const item of [...layout.cells, ...layout.lines]) {
            expect(item.step).toBeGreaterThanOrEqual(0);
            expect(item.step).toBeLessThan(steps.length);
        }
    });

    it.each(solutions)('%s never draws two visible cells in the same place', (_, { layout, steps }) => {
        for (let step = 0; step < steps.length; step++) {
            const taken = new Set<string>();
            for (const cell of layout.cells.filter((c) => isCellVisible(c, step))) {
                const key = `${cell.row},${cell.col}`;
                expect(taken.has(key), `step ${step} overlaps at ${key}`).toBe(false);
                taken.add(key);
            }
        }
    });

    it.each(solutions)('%s shows something new in every working step', (_, { layout, steps, operation }) => {
        const workingSteps = operation === 'long-division' ? steps.length - 1 : steps.length;
        for (let step = 0; step < workingSteps; step++) {
            expect(layout.cells.some((c) => c.step === step), `step ${step}`).toBe(true);
        }
    });
});

describe('long multiplication rows (gray box)', () => {
    it.each(multiplications)('%i × %i writes each partial product and the answer', (a, b) => {
        const { layout, steps, answer } = new LongMultiplicationExplanation(a, b).explain();
        const multiplierDigits = String(b).split('').reverse().map(Number);
        const last = steps.length - 1;

        multiplierDigits.forEach((digit, place) => {
            const expected = digit === 0 ? '0' : String(a * digit) + '0'.repeat(place);
            expect(rowText(layout, last, 3 + place)).toBe(expected);
        });
        expect(rowText(layout, last, layout.rows - 1)).toBe(String(answer));
    });

    it.each(multiplications)('%i × %i only shows non-zero carries, in row 0, during the step that makes them', (a, b) => {
        const { layout } = new LongMultiplicationExplanation(a, b).explain();
        for (const carry of layout.cells.filter((c) => c.kind === 'carry')) {
            expect(carry.row).toBe(0);
            expect(carry.transient).toBe(true);
            expect(Number(carry.text)).toBeGreaterThan(0);
        }
        expect(rowText(layout, 0, 0, ['carry'])).toBe('');
    });
});

describe('long division rows (gray box)', () => {
    it.each(divisions)('%i ÷ %i writes the quotient above the dividend', (dividend, divisor) => {
        const { layout, steps, answer } = new LongDivisionExplanation(dividend, divisor).explain();
        expect(rowText(layout, steps.length - 1, 0)).toBe(String(answer));
    });

    it.each(divisions.filter(([dividend]) => dividend > 0))('%i ÷ %i finishes with a remainder of 0 on the bottom row', (dividend, divisor) => {
        const { layout, steps } = new LongDivisionExplanation(dividend, divisor).explain();
        const bottom = rowText(layout, steps.length - 1, layout.rows - 1);
        expect(bottom).toMatch(/^0+$/);
    });

    it.each(divisions)('%i ÷ %i adds exactly one quotient digit per working step', (dividend, divisor) => {
        const { layout, steps } = new LongDivisionExplanation(dividend, divisor).explain();
        for (let step = 1; step < steps.length - 1; step++) {
            expect(layout.cells.filter((c) => c.row === 0 && c.step === step)).toHaveLength(1);
        }
    });
});

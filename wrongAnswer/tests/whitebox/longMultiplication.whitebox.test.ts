import { describe, expect, it } from 'vitest';
import { LongMultiplicationExplanation } from '../../../backend/equations/wrongAnswerExplanation/src/LongMultiplicationExplanation';
import { rowText } from '../helpers';

describe('LongMultiplicationExplanation steps (white box)', () => {
    const { steps } = new LongMultiplicationExplanation(123, 45).explain();

    it('explains multi-digit multipliers in the set-up step', () => {
        expect(steps[0].details).toEqual([
            'Multiply 123 by each digit of 45, starting with the ones digit.',
            'Each digit gives one row (a partial product). Add the rows at the end.',
        ]);
    });

    it('writes the ones row with carries', () => {
        expect(steps[1].title).toBe('Multiply by the ones digit (5)');
        expect(steps[1].description).toBe('Multiply 123 by 5, the ones digit of 45, working from right to left.');
        expect(steps[1].details).toEqual([
            '5 × 3 = 15 → write 5, carry 1',
            '5 × 2 + 1 carried = 11 → write 1, carry 1',
            '5 × 1 + 1 carried = 6 → write 6',
            'Row: 615',
        ]);
    });

    it('adds placeholder zeros for rows past the ones place', () => {
        expect(steps[2].title).toBe('Multiply by the tens digit (4)');
        expect(steps[2].description).toBe('The 4 is in the tens place, so it is worth 40. Write 1 placeholder zero on the right first, then multiply 123 by 4.');
        expect(steps[2].details).toEqual([
            '4 × 3 = 12 → write 2, carry 1',
            '4 × 2 + 1 carried = 9 → write 9',
            '4 × 1 = 4 → write 4',
            'Row: 492 plus 1 placeholder zero → 4920',
        ]);
    });

    it('adds the partial products column by column and states the answer', () => {
        expect(steps[3].title).toBe('Add the partial products');
        expect(steps[3].description).toBe('Add 615 + 4920 column by column, starting with the ones column.');
        expect(steps[3].details).toEqual([
            'Ones: 5 + 0 = 5 → write 5',
            'Tens: 1 + 2 = 3 → write 3',
            'Hundreds: 6 + 9 = 15 → write 5, carry 1',
            'Thousands: 4 + 1 carried = 5 → write 5',
            '123 × 45 = 5535',
        ]);
    });

    it('writes the whole total for the last multiplicand digit instead of carrying', () => {
        expect(new LongMultiplicationExplanation(99, 5).explain().steps[1].details).toEqual([
            '5 × 9 = 45 → write 5, carry 4',
            '5 × 9 + 4 carried = 49 → write 49',
            'Row: 495',
            '99 × 5 = 495',
        ]);
    });

    it('writes the whole sum for the last addition column instead of carrying', () => {
        const details = new LongMultiplicationExplanation(9, 19).explain().steps[3].details;
        expect(details).toEqual(['Ones: 1 + 0 = 1 → write 1', 'Tens: 8 + 9 = 17 → write 17', '9 × 19 = 171']);
    });

    it('skips the addition step and states the answer in the only row for one-digit multipliers', () => {
        const solution = new LongMultiplicationExplanation(12, 3).explain();
        expect(solution.steps).toHaveLength(2);
        expect(solution.steps[0].details).toEqual(['3 has one digit, so a single row of multiplying gives the answer.']);
        expect(solution.steps[1].details).toEqual(['3 × 2 = 6 → write 6', '3 × 1 = 3 → write 3', 'Row: 36', '12 × 3 = 36']);
    });

    it('handles a 0 multiplier digit past the ones place as a single-zero row', () => {
        const { steps } = new LongMultiplicationExplanation(12, 102).explain();
        expect(steps[2].description).toBe('The 0 is in the tens place, so this whole row is 0.');
        expect(steps[2].details).toEqual(['Anything times 0 is 0, so this whole row is just 0 (no placeholder zeros needed).']);
        expect(steps[4].description).toBe('Add 24 + 0 + 1200 column by column, starting with the ones column.');
    });

    it('handles a 0 multiplier digit in the ones place', () => {
        const { steps } = new LongMultiplicationExplanation(12, 0).explain();
        expect(steps[1].description).toBe('Multiply 12 by 0, the ones digit of 0, working from right to left.');
        expect(steps[1].details).toEqual(['Anything times 0 is 0, so this row is 0.', '12 × 0 = 0']);
    });

    it('uses the ones-place wording for a 0 ones digit even with more digits to follow', () => {
        expect(new LongMultiplicationExplanation(12, 10).explain().steps[1].description).toBe('Multiply 12 by 0, the ones digit of 10, working from right to left.');
    });
});

describe('LongMultiplicationExplanation layout (white box)', () => {
    const { layout } = new LongMultiplicationExplanation(123, 45).explain();
    const at = (row: number, col: number) => layout.cells.filter((c) => c.row === row && c.col === col);

    it('sizes the grid to the widest row plus the × column', () => {
        expect(layout.columns).toBe(5);
        expect(layout.rows).toBe(6);
    });

    it('sets up the operands, × sign and line in step 0', () => {
        expect(rowText(layout, 0, 1)).toBe('123');
        expect(rowText(layout, 0, 2)).toBe('45');
        expect(at(2, 1)).toEqual([{ row: 2, col: 1, text: '×', kind: 'symbol', step: 0, transient: false }]);
        expect(layout.lines[0]).toEqual({ row: 2, fromCol: 0, toCol: 4, edge: 'bottom', step: 0, fromOffset: 0 });
    });

    it('writes partial products right-aligned, with placeholder zeros marked as placeholders', () => {
        expect(rowText(layout, 1, 3)).toBe('615');
        expect(rowText(layout, 2, 4)).toBe('4920');
        expect(at(4, 4)[0].kind).toBe('placeholder');
    });

    it('puts non-zero carries in row 0 as transient cells for their own step', () => {
        const carries = layout.cells.filter((c) => c.kind === 'carry').map((c) => [c.step, c.col, c.text, c.transient]);
        expect(carries).toEqual([
            [1, 3, '1', true],
            [1, 2, '1', true],
            [2, 3, '1', true],
            [3, 1, '1', true],
        ]);
    });

    it('adds a + sign, a line and the answer row in the addition step', () => {
        expect(at(4, 0)).toEqual([{ row: 4, col: 0, text: '+', kind: 'symbol', step: 3, transient: false }]);
        expect(layout.lines[1]).toEqual({ row: 4, fromCol: 0, toCol: 4, edge: 'bottom', step: 3, fromOffset: 0 });
        expect(rowText(layout, 3, 5)).toBe('5535');
    });

    it('draws a 0 row as one 0 in the ones column', () => {
        const zeroRow = new LongMultiplicationExplanation(12, 102).explain().layout.cells.filter((c) => c.row === 4);
        expect(zeroRow).toEqual([{ row: 4, col: 4, text: '0', kind: 'digit', step: 2, transient: false }]);
    });
});

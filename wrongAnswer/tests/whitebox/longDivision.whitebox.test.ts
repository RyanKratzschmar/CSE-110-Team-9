import { describe, expect, it } from 'vitest';
import { LongDivisionExplanation } from '../../../backend/equations/wrongAnswerExplanation/src/LongDivisionExplanation';
import { rowText } from '../helpers';

describe('LongDivisionExplanation steps (white box)', () => {
    it('starts with more than one digit when the divisor does not go into the first digit', () => {
        expect(new LongDivisionExplanation(156, 12).explain().steps[0].details).toEqual([
            '12 is the divisor (outside the bracket); 156 is the dividend (inside).',
            '12 does not go into 1, so start with the first 2 digits: 15.',
        ]);
    });

    it('starts with the first digit when the divisor goes into it', () => {
        expect(new LongDivisionExplanation(408, 4).explain().steps[0].details[1]).toBe('4 goes into 4, so start with the first digit.');
    });

    it('explains a 0 dividend without a placeholder-zero note', () => {
        const { steps } = new LongDivisionExplanation(0, 5).explain();
        expect(steps[0].details[1]).toBe('0 divided by any number is 0.');
        expect(steps[1].description).toBe('5 does not go into 0, so write 0 in the quotient above the 0.');
    });

    it('walks through a non-zero quotient digit without bringing a digit down', () => {
        const step = new LongDivisionExplanation(156, 12).explain().steps[1];
        expect(step.title).toBe('Divide 15 by 12');
        expect(step.description).toBe('12 goes into 15 1 time. Write 1 in the quotient above the 5 (the tens place).');
        expect(step.details).toEqual([
            '1 × 12 = 12, and 2 × 12 = 24 is too big.',
            'Subtract: 15 − 12 = 3.',
            '3 is less than 12, so 1 is the right digit.',
        ]);
    });

    it('brings down the next digit for later quotient digits', () => {
        const step = new LongDivisionExplanation(156, 12).explain().steps[2];
        expect(step.title).toBe('Divide 36 by 12');
        expect(step.description).toBe('12 goes into 36 3 times. Write 3 in the quotient above the 6 (the ones place).');
        expect(step.details[0]).toBe('Bring down the next digit, 6, to make 36.');
    });

    it('does not mention a too-big next multiple when the quotient digit is 9', () => {
        expect(new LongDivisionExplanation(81, 9).explain().steps[1].details[0]).toBe('9 × 9 = 81.');
    });

    it('explains a 0 quotient digit in the middle and warns not to skip it', () => {
        const step = new LongDivisionExplanation(408, 4).explain().steps[2];
        expect(step.title).toBe('Divide 0 by 4');
        expect(step.description).toBe("4 does not go into 0, so write 0 in the quotient above the 0. Don't skip this zero: it holds the tens place.");
        expect(step.details).toEqual([
            'Bring down the next digit, 0, to make 0.',
            '4 is already bigger than 0, so 4 goes into it 0 times.',
            'Write 0 in the quotient and keep going.',
        ]);
    });

    it('checks the answer with multiplication in the last step', () => {
        const last = new LongDivisionExplanation(156, 12).explain().steps.at(-1)!;
        expect(last.description).toBe('Multiply the quotient by the divisor: 13 × 12 = 156. It matches the dividend, so 156 ÷ 12 = 13.');
        expect(last.details).toEqual([]);
    });
});

describe('LongDivisionExplanation layout (white box)', () => {
    const { layout } = new LongDivisionExplanation(156, 12).explain();
    const at = (row: number, col: number) => layout.cells.filter((c) => c.row === row && c.col === col);

    it('sets up divisor, bracket, dividend and the bracket line in step 0', () => {
        expect(layout.columns).toBe(6);
        expect(rowText(layout, 0, 1)).toBe('12156');
        expect(at(1, 2)).toEqual([{ row: 1, col: 2, text: ')', kind: 'bracket', step: 0, transient: false }]);
        expect(layout.lines[0]).toEqual({ row: 1, fromCol: 2, toCol: 5, edge: 'top', step: 0, fromOffset: 0.55 });
    });

    it('writes quotient digits in row 0 above the digit they belong to', () => {
        expect(at(0, 4)[0]).toMatchObject({ text: '1', step: 1 });
        expect(at(0, 5)[0]).toMatchObject({ text: '3', step: 2 });
    });

    it('writes each product with a minus sign and a line under it', () => {
        expect(rowText(layout, 1, 2)).toBe('12');
        expect(at(2, 2)[0]).toMatchObject({ text: '−', kind: 'symbol', step: 1 });
        expect(layout.lines[1]).toMatchObject({ row: 2, fromCol: 2, toCol: 4, edge: 'bottom', step: 1 });
    });

    it('brings the next digit down next to the remainder', () => {
        expect(rowText(layout, 1, 3)).toBe('3');
        expect(rowText(layout, 2, 3)).toBe('36');
    });

    it('always writes the last remainder, even when it is 0', () => {
        expect(rowText(layout, 2, 5)).toBe('0');
    });

    it('skips a 0 remainder before the last stage', () => {
        const zeroRemainder = new LongDivisionExplanation(408, 4).explain().layout;
        expect(zeroRemainder.cells.filter((c) => c.row === 3 && c.step === 1)).toEqual([]);
        expect(rowText(zeroRemainder, 3, 3)).toBe('08');
    });

    it('adds no product rows for a 0 quotient digit', () => {
        const zeroRemainder = new LongDivisionExplanation(408, 4).explain().layout;
        expect(zeroRemainder.cells.filter((c) => c.step === 2).map((c) => [c.row, c.text])).toEqual([[3, '0'], [0, '0']]);
        expect(zeroRemainder.lines.filter((l) => l.step === 2)).toEqual([]);
    });
});

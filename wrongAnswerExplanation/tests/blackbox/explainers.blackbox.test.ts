import { describe, expect, it } from 'vitest';
import { LongDivisionExplanation } from '../../src/LongDivisionExplanation';
import { LongMultiplicationExplanation } from '../../src/LongMultiplicationExplanation';

describe('LongMultiplicationExplanation (black box)', () => {
    it.each([
        [123, 45, 5535],
        [12, 3, 36],
        [0, 987, 0],
        [987, 0, 0],
        [1, 1, 1],
        [99, 99, 9801],
        [12, 102, 1224],
        [987654, 123456, 121931812224],
    ])('%i × %i = %i', (a, b, expected) => {
        const solution = new LongMultiplicationExplanation(a, b).explain();
        expect(solution.answer).toBe(expected);
    });

    it('describes the problem it was given', () => {
        const solution = new LongMultiplicationExplanation(123, 45).explain();
        expect(solution.operation).toBe('long-multiplication');
        expect(solution.operatorSymbol).toBe('×');
        expect(solution.operands).toEqual([123, 45]);
        expect(solution.problemText).toBe('123 × 45');
    });

    it('starts with a set-up step and finishes by stating the answer', () => {
        const { steps } = new LongMultiplicationExplanation(123, 45).explain();
        expect(steps[0].title).toBe('Set up the problem');
        expect(steps.at(-1)!.details).toContain('123 × 45 = 5535');
    });

    it('has one step per multiplier digit, plus set-up and (for multi-digit multipliers) an addition step', () => {
        expect(new LongMultiplicationExplanation(123, 4).explain().steps).toHaveLength(2);
        expect(new LongMultiplicationExplanation(123, 45).explain().steps).toHaveLength(4);
        expect(new LongMultiplicationExplanation(123, 456).explain().steps).toHaveLength(5);
    });

    it('gives every step a title and a description', () => {
        for (const step of new LongMultiplicationExplanation(4087, 302).explain().steps) {
            expect(step.title.length).toBeGreaterThan(0);
            expect(step.description.length).toBeGreaterThan(0);
        }
    });

    it('produces the same explanation for the same problem', () => {
        expect(new LongMultiplicationExplanation(58, 76).explain()).toEqual(new LongMultiplicationExplanation(58, 76).explain());
    });

    it.each([
        [-1, 5],
        [5, -1],
        [1.5, 2],
        [2, 0.25],
        [Number.NaN, 2],
        [Number.POSITIVE_INFINITY, 2],
    ])('rejects %d × %d as not whole numbers', (a, b) => {
        expect(() => new LongMultiplicationExplanation(a, b)).toThrow(RangeError);
        expect(() => new LongMultiplicationExplanation(a, b)).toThrow(/must be a whole number/);
    });

    it('rejects products too large to compute exactly', () => {
        expect(() => new LongMultiplicationExplanation(Number.MAX_SAFE_INTEGER, 2)).toThrow(/too large/);
    });
});

describe('LongDivisionExplanation (black box)', () => {
    it.each([
        [156, 12, 13],
        [408, 4, 102],
        [0, 5, 0],
        [81, 9, 9],
        [7, 7, 1],
        [7, 1, 7],
        [1000, 8, 125],
        [123456, 3, 41152],
    ])('%i ÷ %i = %i', (dividend, divisor, expected) => {
        expect(new LongDivisionExplanation(dividend, divisor).explain().answer).toBe(expected);
    });

    it('describes the problem it was given', () => {
        const solution = new LongDivisionExplanation(156, 12).explain();
        expect(solution.operation).toBe('long-division');
        expect(solution.operatorSymbol).toBe('÷');
        expect(solution.operands).toEqual([156, 12]);
        expect(solution.problemText).toBe('156 ÷ 12');
    });

    it('starts with a set-up step and ends by checking the answer with multiplication', () => {
        const { steps } = new LongDivisionExplanation(156, 12).explain();
        expect(steps[0].title).toBe('Set up the problem');
        const last = steps.at(-1)!;
        expect(last.title).toBe('Check by multiplying');
        expect(last.description).toContain('13 × 12 = 156');
    });

    it('has one step per quotient digit, plus set-up and check steps', () => {
        for (const [dividend, divisor] of [[156, 12], [408, 4], [0, 5], [123456, 3]]) {
            const solution = new LongDivisionExplanation(dividend, divisor).explain();
            expect(solution.steps).toHaveLength(String(solution.answer).length + 2);
        }
    });

    it('gives every step a title and a description', () => {
        for (const step of new LongDivisionExplanation(40812, 12).explain().steps) {
            expect(step.title.length).toBeGreaterThan(0);
            expect(step.description.length).toBeGreaterThan(0);
        }
    });

    it('rejects a divisor of 0', () => {
        expect(() => new LongDivisionExplanation(10, 0)).toThrow(/divisor must be greater than 0/);
    });

    it('rejects problems that leave a remainder', () => {
        expect(() => new LongDivisionExplanation(7, 2)).toThrow(/remainder of 1/);
    });

    it.each([
        [-12, 4],
        [12, -4],
        [12.5, 5],
        [12, 1.5],
    ])('rejects %d ÷ %d as not whole numbers', (dividend, divisor) => {
        expect(() => new LongDivisionExplanation(dividend, divisor)).toThrow(/must be a whole number/);
    });
});

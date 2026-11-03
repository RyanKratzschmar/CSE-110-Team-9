import { describe, expect, it } from 'vitest';
import { LongMultiplicationHint } from '../backend/equations/hints/LongMultiplicationHint';
import { LongDivisionHint } from '../backend/equations/hints/LongDivisionHint';
import { HintPopUpModel } from '../frontend/src/hintPopUp/model/HintPopUpModel';

// LongMultiplicationHint Tests
describe('LongMultiplicationHint', () => {
    it('generates steps for single-digit multiplier', () => {
        const hint = new LongMultiplicationHint(42, 3);
        const data = hint.getHint();
        expect(data.problemText).toBe('42 × 3');
        expect(data.steps).toHaveLength(3);
    });

    it('generates steps for multi-digit multiplier with placeholder zero', () => {
        const hint = new LongMultiplicationHint(123, 45);
        const data = hint.getHint();
        expect(data.problemText).toBe('123 × 45');
        expect(data.steps).toHaveLength(4);
    });

    it('rejects negative or non-integer inputs', () => {
        expect(() => new LongMultiplicationHint(-1, 5)).toThrow();
        expect(() => new LongMultiplicationHint(1.5, 2)).toThrow();
    });
});

// LongDivisionHint Tests
describe('LongDivisionHint', () => {
    it('generates DMSB steps for division', () => {
        const hint = new LongDivisionHint(252, 6);
        const data = hint.getHint();
        expect(data.problemText).toBe('252 ÷ 6');
        expect(data.steps.length).toBeGreaterThanOrEqual(4);
        expect(data.steps[0].title).toContain('DMSB');
    });

    it('rejects a divisor of 0', () => {
        expect(() => new LongDivisionHint(10, 0)).toThrow();
    });

    it('rejects negative inputs', () => {
        expect(() => new LongDivisionHint(-10, 2)).toThrow();
    });
});

// HintPopUpModel Tests
describe('HintPopUpModel', () => {
    it('starts closed and opens with hint data', () => {
        const model = new HintPopUpModel();
        expect(model.getState().isOpen).toBe(false);

        const hint = new LongMultiplicationHint(12, 34).getHint();
        model.open(hint);
        expect(model.getState().isOpen).toBe(true);
        expect(model.getState().hint).toBe(hint);

        model.close();
        expect(model.getState().isOpen).toBe(false);
    });

    it('updates and clamps scroll position', () => {
        const model = new HintPopUpModel();
        model.open(new LongMultiplicationHint(10, 20).getHint());

        model.scrollBy(50, 100);
        expect(model.getState().scrollY).toBe(50);

        model.scrollTo(200, 100);
        expect(model.getState().scrollY).toBe(100);
    });
});

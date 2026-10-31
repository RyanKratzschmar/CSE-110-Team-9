import { describe, expect, it, vi } from 'vitest';
import { WrongAnswerPopUpModel } from '../../src/model/WrongAnswerPopUpModel';
import { LongDivisionExplanation } from '../../src/LongDivisionExplanation';

const solution = new LongDivisionExplanation(156, 12).explain();

function openModel(): WrongAnswerPopUpModel {
    const model = new WrongAnswerPopUpModel();
    model.open(solution);
    return model;
}

describe('WrongAnswerPopUpModel (white box)', () => {
    it('does not notify when closing an already closed pop-up', () => {
        const model = new WrongAnswerPopUpModel();
        const listener = vi.fn();
        model.subscribe(listener);
        model.close();
        expect(listener).not.toHaveBeenCalled();
    });

    it('does not notify when scrolling while closed', () => {
        const model = new WrongAnswerPopUpModel();
        const listener = vi.fn();
        model.subscribe(listener);
        model.scrollTo(10, 100);
        expect(listener).not.toHaveBeenCalled();
    });

    it('does not notify when the clamped scroll position does not change', () => {
        const model = openModel();
        model.scrollTo(100, 100);
        const listener = vi.fn();
        model.subscribe(listener);
        model.scrollTo(150, 100);
        model.scrollBy(10, 100);
        expect(listener).not.toHaveBeenCalled();
    });

    it('treats a negative maximum scroll as 0', () => {
        const model = openModel();
        model.scrollTo(50, -10);
        expect(model.getState().scrollY).toBe(0);
    });

    it('only patches isOpen when closing, keeping the solution and scroll', () => {
        const model = openModel();
        model.scrollTo(40, 100);
        model.close();
        expect(model.getState()).toEqual({ isOpen: false, solution, scrollY: 40 });
    });

    it('replaces the state object on every change instead of mutating it', () => {
        const model = openModel();
        const before = model.getState();
        model.scrollTo(20, 100);
        expect(model.getState()).not.toBe(before);
        expect(before.scrollY).toBe(0);
    });

    it('notifies every subscriber', () => {
        const model = new WrongAnswerPopUpModel();
        const first = vi.fn();
        const second = vi.fn();
        model.subscribe(first);
        model.subscribe(second);
        model.open(solution);
        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
    });

    it('subscribing the same listener twice only registers it once', () => {
        const model = new WrongAnswerPopUpModel();
        const listener = vi.fn();
        model.subscribe(listener);
        model.subscribe(listener);
        model.open(solution);
        expect(listener).toHaveBeenCalledOnce();
    });
});

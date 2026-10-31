import { describe, expect, it, vi } from 'vitest';
import { WrongAnswerPopUpModel } from '../../src/model/WrongAnswerPopUpModel';
import { LongMultiplicationExplanation } from '../../src/LongMultiplicationExplanation';

const solution = new LongMultiplicationExplanation(123, 45).explain();

describe('WrongAnswerPopUpModel (black box)', () => {
    it('starts closed with no solution and no scroll', () => {
        expect(new WrongAnswerPopUpModel().getState()).toEqual({ isOpen: false, solution: null, scrollY: 0 });
    });

    it('opens with the given solution scrolled to the top', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(solution);
        expect(model.getState()).toEqual({ isOpen: true, solution, scrollY: 0 });
    });

    it('closes after being opened', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(solution);
        model.close();
        expect(model.getState().isOpen).toBe(false);
    });

    it('scrolls within 0 and the maximum scroll', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(solution);

        model.scrollTo(50, 100);
        expect(model.getState().scrollY).toBe(50);

        model.scrollTo(500, 100);
        expect(model.getState().scrollY).toBe(100);

        model.scrollTo(-20, 100);
        expect(model.getState().scrollY).toBe(0);
    });

    it('scrolls relative to the current position', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(solution);
        model.scrollBy(30, 100);
        model.scrollBy(30, 100);
        expect(model.getState().scrollY).toBe(60);
        model.scrollBy(-100, 100);
        expect(model.getState().scrollY).toBe(0);
    });

    it('resets the scroll when opened again', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(solution);
        model.scrollTo(80, 100);
        model.open(solution);
        expect(model.getState().scrollY).toBe(0);
    });

    it('ignores scrolling while closed', () => {
        const model = new WrongAnswerPopUpModel();
        model.scrollTo(50, 100);
        expect(model.getState().scrollY).toBe(0);
    });

    it('tells subscribers about each change and stops after they unsubscribe', () => {
        const model = new WrongAnswerPopUpModel();
        const listener = vi.fn();
        const unsubscribe = model.subscribe(listener);

        model.open(solution);
        expect(listener).toHaveBeenLastCalledWith(model.getState());

        unsubscribe();
        model.close();
        expect(listener).toHaveBeenCalledTimes(1);
    });
});

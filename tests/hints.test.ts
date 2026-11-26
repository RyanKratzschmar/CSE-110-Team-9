// @vitest-environment jsdom
import 'vitest-canvas-mock';
import { describe, expect, it } from 'vitest';
import Konva from 'konva';
import { LongMultiplicationHint } from '../backend/equations/hints/LongMultiplicationHint';
import { LongDivisionHint } from '../backend/equations/hints/LongDivisionHint';
import { HintPopUpModel } from '../frontend/src/hintPopUp/model/HintPopUpModel';
import { HintPopUpController } from '../frontend/src/hintPopUp/controller/HintPopUpController';
import { HintPopUpView } from '../frontend/src/hintPopUp/view/HintPopUpView';

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
    it('starts closed and opens with hint data at step 0', () => {
        const model = new HintPopUpModel();
        expect(model.getState().isOpen).toBe(false);

        const hint = new LongMultiplicationHint(12, 34).getHint();
        model.open(hint);
        expect(model.getState().isOpen).toBe(true);
        expect(model.getState().hint).toBe(hint);
        expect(model.getState().currentStepIndex).toBe(0);
        expect(model.getState().unlockedStepCount).toBe(1);

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

    it('advances steps 1 by 1 as the user asks with nextStep()', () => {
        const model = new HintPopUpModel();
        const hint = new LongMultiplicationHint(123, 45).getHint(); // 4 steps
        model.open(hint);

        expect(model.getState().currentStepIndex).toBe(0);
        expect(model.getState().unlockedStepCount).toBe(1);

        model.nextStep();
        expect(model.getState().currentStepIndex).toBe(1);
        expect(model.getState().unlockedStepCount).toBe(2);

        model.nextStep();
        expect(model.getState().currentStepIndex).toBe(2);
        expect(model.getState().unlockedStepCount).toBe(3);

        model.nextStep();
        expect(model.getState().currentStepIndex).toBe(3);
        expect(model.getState().unlockedStepCount).toBe(4);

        // Clamps at the end
        model.nextStep();
        expect(model.getState().currentStepIndex).toBe(3);
        expect(model.getState().unlockedStepCount).toBe(4);
    });

    it('navigates backward with prevStep() and clamps at 0', () => {
        const model = new HintPopUpModel();
        const hint = new LongMultiplicationHint(123, 45).getHint();
        model.open(hint);

        model.nextStep();
        model.nextStep();
        expect(model.getState().currentStepIndex).toBe(2);

        model.prevStep();
        expect(model.getState().currentStepIndex).toBe(1);

        model.prevStep();
        expect(model.getState().currentStepIndex).toBe(0);

        // Clamps at 0
        model.prevStep();
        expect(model.getState().currentStepIndex).toBe(0);
    });

    it('reopens the same problem without resetting unlocked progress', () => {
        const model = new HintPopUpModel();
        const hint = new LongMultiplicationHint(123, 45).getHint();
        model.open(hint);

        model.nextStep();
        model.nextStep();
        expect(model.getState().currentStepIndex).toBe(2);
        expect(model.getState().unlockedStepCount).toBe(3);

        model.close();
        expect(model.getState().isOpen).toBe(false);

        // Reopen same problem
        model.open(hint);
        expect(model.getState().isOpen).toBe(true);
        expect(model.getState().currentStepIndex).toBe(2);
        expect(model.getState().unlockedStepCount).toBe(3);
    });

    it('resets step progress when a different problem is opened', () => {
        const model = new HintPopUpModel();
        const hint1 = new LongMultiplicationHint(12, 34).getHint();
        const hint2 = new LongDivisionHint(100, 5).getHint();

        model.open(hint1);
        model.nextStep();
        expect(model.getState().currentStepIndex).toBe(1);

        model.open(hint2);
        expect(model.getState().currentStepIndex).toBe(0);
        expect(model.getState().unlockedStepCount).toBe(1);
    });

    it('reset() resets all hint state', () => {
        const model = new HintPopUpModel();
        const hint = new LongMultiplicationHint(12, 34).getHint();
        model.open(hint);
        model.nextStep();

        model.reset();
        const state = model.getState();
        expect(state.isOpen).toBe(false);
        expect(state.hint).toBeNull();
        expect(state.currentStepIndex).toBe(0);
        expect(state.unlockedStepCount).toBe(1);
    });
});

// HintPopUpView and HintPopUpController Tests
describe('HintPopUpView & Controller', () => {
    it('renders a single hint at a time with badge and navigation', () => {
        const container = document.createElement('div');
        const stage = new Konva.Stage({ container, width: 800, height: 600 });
        const controller = new HintPopUpController(stage);

        controller.showLongMultiplicationHint(42, 3);
        expect(controller.isOpen()).toBe(true);

        // Search for rendered texts in the stage
        const texts = stage.find('Text').map((t) => t.getAttr('text'));
        expect(texts).toContain('HINT 1 OF 3');
        expect(texts).toContain('Hint 1 of 3');
        expect(texts).toContain('Next Hint →');
        expect(texts).toContain('← Previous Hint');

        // Advance to next hint
        controller.nextHint();
        const textsAfterNext = stage.find('Text').map((t) => t.getAttr('text'));
        expect(textsAfterNext).toContain('HINT 2 OF 3');
        expect(textsAfterNext).toContain('Hint 2 of 3');

        // Go back
        controller.prevHint();
        const textsAfterPrev = stage.find('Text').map((t) => t.getAttr('text'));
        expect(textsAfterPrev).toContain('HINT 1 OF 3');

        controller.destroy();
    });

    it('navigates with keyboard arrow keys', () => {
        const container = document.createElement('div');
        const stage = new Konva.Stage({ container, width: 800, height: 600 });
        const controller = new HintPopUpController(stage);

        controller.showLongMultiplicationHint(42, 3);
        expect(controller.getModel().getState().currentStepIndex).toBe(0);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
        expect(controller.getModel().getState().currentStepIndex).toBe(1);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
        expect(controller.getModel().getState().currentStepIndex).toBe(0);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
        expect(controller.isOpen()).toBe(false);

        controller.destroy();
    });
});

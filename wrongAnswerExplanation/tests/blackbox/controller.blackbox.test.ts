import type Konva from 'konva';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WrongAnswerPopUpController } from '../../src/controller/WrongAnswerPopUpController';
import { createStage, destroyStage, pressKey } from '../helpers';

describe('WrongAnswerPopUpController (black box)', () => {
    let stage: Konva.Stage;
    let controller: WrongAnswerPopUpController;

    beforeEach(() => {
        stage = createStage(800, 600);
        controller = new WrongAnswerPopUpController(stage);
    });

    afterEach(() => {
        controller.destroy();
        destroyStage(stage);
    });

    it('is closed until an explanation is shown', () => {
        expect(controller.isOpen()).toBe(false);
    });

    it('opens for a long multiplication explanation', () => {
        controller.showLongMultiplicationExplanation(123, 45);
        expect(controller.isOpen()).toBe(true);
    });

    it('opens for a long division explanation', () => {
        controller.showLongDivisionExplanation(156, 12);
        expect(controller.isOpen()).toBe(true);
    });

    it('closes when asked to', () => {
        controller.showLongDivisionExplanation(156, 12);
        controller.close();
        expect(controller.isOpen()).toBe(false);
    });

    it('closes when Escape is pressed', () => {
        controller.showLongMultiplicationExplanation(123, 45);
        const event = pressKey('Escape');
        expect(controller.isOpen()).toBe(false);
        expect(event.defaultPrevented).toBe(true);
    });

    it.each(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'])('handles the %j key while open', (key) => {
        controller.showLongMultiplicationExplanation(123, 45);
        expect(pressKey(key).defaultPrevented).toBe(true);
        expect(controller.isOpen()).toBe(true);
    });

    it('leaves other keys alone while open', () => {
        controller.showLongMultiplicationExplanation(123, 45);
        expect(pressKey('a').defaultPrevented).toBe(false);
    });

    it('leaves every key alone while closed', () => {
        expect(pressKey('ArrowDown').defaultPrevented).toBe(false);
        expect(pressKey('Escape').defaultPrevented).toBe(false);
    });

    it('stays closed when given an invalid problem', () => {
        expect(() => controller.showLongDivisionExplanation(7, 2)).toThrow(RangeError);
        expect(() => controller.showLongMultiplicationExplanation(-1, 2)).toThrow(RangeError);
        expect(controller.isOpen()).toBe(false);
    });

    it('stops listening to the keyboard once destroyed', () => {
        controller.showLongMultiplicationExplanation(123, 45);
        controller.destroy();
        expect(pressKey('Escape').defaultPrevented).toBe(false);
    });
});

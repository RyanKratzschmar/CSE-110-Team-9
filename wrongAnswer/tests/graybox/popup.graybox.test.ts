import Konva from 'konva';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WrongAnswerPopUpController } from '../../../backend/equations/wrongAnswerExplanation/src/controller/WrongAnswerPopUpController';
import { LongDivisionExplanation } from '../../../backend/equations/wrongAnswerExplanation/src/LongDivisionExplanation';
import { LongMultiplicationExplanation } from '../../../backend/equations/wrongAnswerExplanation/src/LongMultiplicationExplanation';
import { closeButton, contentGroup, createStage, destroyStage, overlayRect, panelGroup, popupLayer, pressKey, stepLabels } from '../helpers';

describe('pop-up controller, model and view together (gray box)', () => {
    let stage: Konva.Stage;
    let controller: WrongAnswerPopUpController;

    const scrollY = () => -contentGroup(stage).y();

    beforeEach(() => {
        stage = createStage(400, 400);
        controller = new WrongAnswerPopUpController(stage);
    });

    afterEach(() => {
        controller.destroy();
        destroyStage(stage);
    });

    it('draws one STEP label for every explanation step', () => {
        controller.showLongMultiplicationExplanation(123, 45);
        const steps = new LongMultiplicationExplanation(123, 45).explain().steps;
        expect(stepLabels(stage)).toEqual(steps.map((_, i) => `STEP ${i + 1}`));
    });

    it('shows the problem in the title', () => {
        controller.showLongDivisionExplanation(156, 12);
        const title = panelGroup(stage).findOne('Text') as Konva.Text;
        expect(title.text()).toBe('Worked solution: 156 ÷ 12');
    });

    it('opens scrolled to the top and shows the layer above everything', () => {
        controller.showLongMultiplicationExplanation(987654, 123456);
        expect(scrollY()).toBe(0);
        expect(popupLayer(stage).visible()).toBe(true);
    });

    it('scrolls by a line with the arrow keys', () => {
        controller.showLongMultiplicationExplanation(987654, 123456);
        pressKey('ArrowDown');
        pressKey('ArrowDown');
        expect(scrollY()).toBe(120);
        pressKey('ArrowUp');
        expect(scrollY()).toBe(60);
    });

    it('jumps to the ends with Home and End, and never scrolls past them', () => {
        controller.showLongMultiplicationExplanation(987654, 123456);
        pressKey('End');
        const max = scrollY();
        expect(max).toBeGreaterThan(0);
        pressKey('ArrowDown');
        expect(scrollY()).toBe(max);
        pressKey('Home');
        expect(scrollY()).toBe(0);
        pressKey('ArrowUp');
        expect(scrollY()).toBe(0);
    });

    it('scrolls by most of a page with PageDown and space', () => {
        controller.showLongMultiplicationExplanation(987654, 123456);
        const viewport = (popupLayer(stage).findOne((n: Konva.Node) => n instanceof Konva.Group && n.clipHeight() > 0) as Konva.Group).clipHeight();
        pressKey('PageDown');
        const page = scrollY();
        expect(page).toBeCloseTo(viewport * 0.9);
        pressKey(' ');
        const twoPages = scrollY();
        pressKey('End');
        expect(twoPages).toBeCloseTo(Math.min(page * 2, scrollY()));
    });

    it('scrolls when the mouse wheel is used over the panel', () => {
        controller.showLongMultiplicationExplanation(987654, 123456);
        panelGroup(stage).fire('wheel', { evt: new WheelEvent('wheel', { deltaY: 75 }) });
        expect(scrollY()).toBe(75);
    });

    it('closes from the overlay and from the close button', () => {
        controller.showLongDivisionExplanation(156, 12);
        overlayRect(stage).fire('click');
        expect(controller.isOpen()).toBe(false);
        expect(popupLayer(stage).visible()).toBe(false);

        controller.showLongDivisionExplanation(156, 12);
        closeButton(stage).fire('click');
        expect(controller.isOpen()).toBe(false);
    });

    it('replaces the explanation and resets scrolling when another problem is shown', () => {
        controller.showLongMultiplicationExplanation(987654, 123456);
        pressKey('ArrowDown');
        controller.showLongDivisionExplanation(408, 4);
        expect(scrollY()).toBe(0);
        expect(stepLabels(stage)).toHaveLength(new LongDivisionExplanation(408, 4).explain().steps.length);
    });

    it('rebuilds for the new size on resize and keeps the scroll in range', () => {
        controller.showLongMultiplicationExplanation(987654, 123456);
        pressKey('End');
        const before = scrollY();

        stage.size({ width: 1200, height: 1000 });
        controller.handleResize();
        expect(overlayRect(stage).width()).toBe(1200);
        pressKey('End');
        const newMax = scrollY();
        expect(newMax).toBeLessThan(before);

        pressKey('ArrowDown');
        expect(scrollY()).toBe(newMax);
    });

    it('hides and clears the layer when closed with Escape', () => {
        controller.showLongMultiplicationExplanation(123, 45);
        pressKey('Escape');
        expect(popupLayer(stage).visible()).toBe(false);
        expect(popupLayer(stage).getChildren()).toHaveLength(0);
    });

    it('removes the pop-up layer from the stage when destroyed', () => {
        controller.showLongMultiplicationExplanation(123, 45);
        controller.destroy();
        expect(stage.getLayers()).toHaveLength(0);
    });
});

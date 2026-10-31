import Konva from 'konva';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WrongAnswerPopUpView, type WrongAnswerPopUpViewHandlers } from '../../src/view/WrongAnswerPopUpView';
import type { WrongAnswerPopUpState } from '../../src/model/WrongAnswerPopUpModel';
import { LongMultiplicationExplanation } from '../../src/LongMultiplicationExplanation';
import type { WorkedSolution } from '../../src/wrongAnswerExplanationPopUp';
import { closeButton, contentGroup, createStage, destroyStage, overlayRect, panelGroup, popupLayer, scrollThumb } from '../helpers';

const shortSolution = new LongMultiplicationExplanation(12, 3).explain();
const longSolution = new LongMultiplicationExplanation(987654, 123456).explain();

function openState(solution: WorkedSolution, scrollY = 0): WrongAnswerPopUpState {
    return { isOpen: true, solution, scrollY };
}

const closedState: WrongAnswerPopUpState = { isOpen: false, solution: null, scrollY: 0 };

let stage: Konva.Stage | null = null;

function setup(width: number, height: number): { view: WrongAnswerPopUpView; handlers: WrongAnswerPopUpViewHandlers; stage: Konva.Stage } {
    stage = createStage(width, height);
    const view = new WrongAnswerPopUpView(stage);
    const handlers = { onScrollBy: vi.fn(), onScrollTo: vi.fn(), onClose: vi.fn() };
    view.setHandlers(handlers);
    return { view, handlers, stage };
}

function trackRect(s: Konva.Stage): Konva.Rect {
    return popupLayer(s).findOne((n: Konva.Node) => n instanceof Konva.Rect && n.fill() === '#f1f5f9') as Konva.Rect;
}

function paperRects(s: Konva.Stage): Konva.Rect[] {
    return popupLayer(s).find((n: Konva.Node) => n instanceof Konva.Rect && n.fill() === '#f8fafc') as Konva.Rect[];
}

afterEach(() => {
    if (stage) {
        destroyStage(stage);
        stage = null;
    }
});

describe('WrongAnswerPopUpView construction and closed rendering (white box)', () => {
    it('adds one hidden, empty layer to the stage', () => {
        const { stage } = setup(800, 600);
        expect(stage.getLayers()).toHaveLength(1);
        expect(popupLayer(stage).visible()).toBe(false);
        expect(popupLayer(stage).getChildren()).toHaveLength(0);
    });

    it('leaves the cursor alone when rendering closed without having been open', () => {
        const { view, stage } = setup(800, 600);
        stage.container().style.cursor = 'crosshair';
        view.render(closedState);
        expect(stage.container().style.cursor).toBe('crosshair');
    });

    it('tears down and resets the cursor when closing after being open', () => {
        const { view, stage } = setup(800, 600);
        view.render(openState(shortSolution));
        closeButton(stage).fire('mouseenter');
        expect(stage.container().style.cursor).toBe('pointer');

        view.render(closedState);
        expect(popupLayer(stage).visible()).toBe(false);
        expect(popupLayer(stage).getChildren()).toHaveLength(0);
        expect(stage.container().style.cursor).toBe('default');
        expect(view.getMaxScroll()).toBe(0);
        expect(view.getViewportHeight()).toBe(0);
    });

    it('treats an open state with no solution as closed', () => {
        const { view, stage } = setup(800, 600);
        view.render({ isOpen: true, solution: null, scrollY: 0 });
        expect(popupLayer(stage).visible()).toBe(false);
    });
});

describe('WrongAnswerPopUpView panel sizing (white box)', () => {
    it.each([
        [1000, 800, 70, 20, 860, 760],
        [320, 400, 10, 16, 300, 368],
        [250, 300, 0, 0, 250, 300],
    ])('on a %ix%i stage puts the panel at (%i, %i) sized %ix%i', (sw, sh, x, y, w, h) => {
        const { view, stage } = setup(sw, sh);
        view.render(openState(shortSolution));
        const panel = panelGroup(stage);
        const background = panel.getChildren()[0] as Konva.Rect;
        expect([panel.x(), panel.y(), background.width(), background.height()]).toEqual([x, y, w, h]);
    });

    it('covers the whole stage with the overlay', () => {
        const { view, stage } = setup(640, 480);
        view.render(openState(shortSolution));
        expect([overlayRect(stage).width(), overlayRect(stage).height()]).toEqual([640, 480]);
    });

    it('draws the work grid beside the text on wide panels', () => {
        const { view, stage } = setup(1000, 800);
        view.render(openState(shortSolution));
        expect(paperRects(stage)[0].width()).toBe(300);
    });

    it('stacks the work grid above the text on narrow panels', () => {
        const { view, stage } = setup(500, 800);
        view.render(openState(shortSolution));
        expect(paperRects(stage)[0].width()).toBe(500 - 32 - 40 - 16);
    });

    it('keeps every grid character inside its box even for wide problems on narrow stages', () => {
        const { view, stage } = setup(300, 600);
        view.render(openState(longSolution));
        const contentWidth = 300 - 40 - 16;
        const gridTexts = popupLayer(stage).find((n: Konva.Node) => n instanceof Konva.Text && n.fontFamily().startsWith('ui-monospace')) as Konva.Text[];
        expect(gridTexts.length).toBeGreaterThan(0);
        for (const text of gridTexts) {
            expect(text.x()).toBeGreaterThanOrEqual(0);
            expect(text.x() + text.width()).toBeLessThanOrEqual(contentWidth + 1e-9);
        }
    });
});

describe('WrongAnswerPopUpView rebuilding (white box)', () => {
    it('reuses the built nodes when only the scroll position changes', () => {
        const { view, stage } = setup(800, 600);
        view.render(openState(longSolution));
        const overlay = overlayRect(stage);
        view.render(openState(longSolution, 50));
        expect(overlayRect(stage)).toBe(overlay);
    });

    it('rebuilds when the solution changes', () => {
        const { view, stage } = setup(800, 600);
        view.render(openState(longSolution));
        const overlay = overlayRect(stage);
        view.render(openState(shortSolution));
        expect(overlayRect(stage)).not.toBe(overlay);
    });

    it('rebuilds when the stage is resized', () => {
        const { view, stage } = setup(800, 600);
        view.render(openState(longSolution));
        const overlay = overlayRect(stage);
        stage.size({ width: 700, height: 500 });
        view.render(openState(longSolution));
        expect(overlayRect(stage)).not.toBe(overlay);
        expect(overlayRect(stage).width()).toBe(700);
    });

    it('rebuilds from the last state on refresh', () => {
        const { view, stage } = setup(800, 600);
        view.render(openState(longSolution, 30));
        const overlay = overlayRect(stage);
        view.refresh();
        expect(overlayRect(stage)).not.toBe(overlay);
        expect(contentGroup(stage).y()).toBe(-30);
    });

    it('does nothing on refresh before the first render', () => {
        const { view, stage } = setup(800, 600);
        view.refresh();
        expect(popupLayer(stage).getChildren()).toHaveLength(0);
    });

    it('removes its layer and resets the cursor when destroyed', () => {
        const { view, stage } = setup(800, 600);
        view.render(openState(shortSolution));
        closeButton(stage).fire('mouseenter');
        view.destroy();
        expect(stage.getLayers()).toHaveLength(0);
        expect(stage.container().style.cursor).toBe('default');
    });
});

describe('WrongAnswerPopUpView scrolling (white box)', () => {
    it('has no scrollbar or scroll range when everything fits', () => {
        const { view, stage } = setup(2000, 2000);
        view.render(openState(shortSolution));
        expect(view.getMaxScroll()).toBe(0);
        expect(scrollThumb(stage)).toBeUndefined();
    });

    it('adds a scrollbar when the steps overflow', () => {
        const { view, stage } = setup(400, 400);
        view.render(openState(longSolution));
        expect(view.getMaxScroll()).toBeGreaterThan(0);
        expect(scrollThumb(stage)).toBeDefined();
    });

    it('clamps the scroll position to the content', () => {
        const { view, stage } = setup(400, 400);
        view.render(openState(longSolution, 1e6));
        expect(contentGroup(stage).y()).toBe(-view.getMaxScroll());
        view.render(openState(longSolution, -50));
        expect(contentGroup(stage).y()).toBeCloseTo(0);
    });

    it('moves the thumb from the top of the track to the bottom as it scrolls', () => {
        const { view, stage } = setup(400, 400);
        view.render(openState(longSolution));
        const thumb = scrollThumb(stage)!;
        const track = trackRect(stage);
        expect(thumb.y()).toBe(track.y());

        view.render(openState(longSolution, view.getMaxScroll()));
        expect(thumb.y() + thumb.height()).toBeCloseTo(track.y() + track.height());
    });

    it('reports a scroll position proportional to where the thumb is dragged', () => {
        const { view, handlers, stage } = setup(400, 400);
        view.render(openState(longSolution));
        const thumb = scrollThumb(stage)!;
        const track = trackRect(stage);
        const travel = track.height() - thumb.height();

        thumb.y(track.y() + travel / 2);
        thumb.fire('dragmove');
        expect(handlers.onScrollTo).toHaveBeenLastCalledWith(expect.closeTo(view.getMaxScroll() / 2));
    });

    it('keeps the dragged thumb on the track', () => {
        const { view, stage } = setup(400, 400);
        view.render(openState(longSolution));
        const thumb = scrollThumb(stage)!;
        const track = trackRect(stage);
        const panel = panelGroup(stage).getAbsolutePosition();
        const bound = thumb.dragBoundFunc()!;

        expect(bound.call(thumb, { x: 0, y: -1000 }, null)).toEqual({ x: panel.x + track.x(), y: panel.y + track.y() });
        expect(bound.call(thumb, { x: 0, y: 1e6 }, null).y).toBeCloseTo(panel.y + track.y() + track.height() - thumb.height());
    });

    it('converts wheel deltas from pixels, lines and pages', () => {
        const { view, handlers, stage } = setup(400, 400);
        view.render(openState(longSolution));
        const panel = panelGroup(stage);

        panel.fire('wheel', { evt: new WheelEvent('wheel', { deltaY: 100, deltaMode: 0 }) });
        expect(handlers.onScrollBy).toHaveBeenLastCalledWith(100);

        panel.fire('wheel', { evt: new WheelEvent('wheel', { deltaY: 3, deltaMode: 1 }) });
        expect(handlers.onScrollBy).toHaveBeenLastCalledWith(120);

        panel.fire('wheel', { evt: new WheelEvent('wheel', { deltaY: 1, deltaMode: 2 }) });
        expect(handlers.onScrollBy).toHaveBeenLastCalledWith(view.getViewportHeight());
    });

    it('scrolls on wheel events over the header, not just over the steps', () => {
        const { view, handlers, stage } = setup(400, 400);
        view.render(openState(longSolution));
        const title = panelGroup(stage).findOne('Text') as Konva.Text;
        const evt = new WheelEvent('wheel', { deltaY: 40, cancelable: true });

        title.fire('wheel', { evt }, true);
        expect(handlers.onScrollBy).toHaveBeenCalledWith(40);
        expect(evt.defaultPrevented).toBe(true);
    });
});

describe('WrongAnswerPopUpView pointer handling (white box)', () => {
    it('asks to close when the overlay is clicked', () => {
        const { view, handlers, stage } = setup(800, 600);
        view.render(openState(shortSolution));
        overlayRect(stage).fire('click');
        expect(handlers.onClose).toHaveBeenCalledOnce();
    });

    it('asks to close when the close button is tapped, without bubbling further', () => {
        const { view, handlers, stage } = setup(800, 600);
        view.render(openState(shortSolution));
        const event = { cancelBubble: false };
        closeButton(stage).fire('tap', event);
        expect(handlers.onClose).toHaveBeenCalledOnce();
        expect(event.cancelBubble).toBe(true);
    });

    it('shows a pointer over the close button', () => {
        const { view, stage } = setup(800, 600);
        view.render(openState(shortSolution));
        const button = closeButton(stage);
        button.fire('mouseenter');
        expect(stage.container().style.cursor).toBe('pointer');
        button.fire('mouseleave');
        expect(stage.container().style.cursor).toBe('default');
    });

    it('shows grab and grabbing cursors on the scrollbar thumb', () => {
        const { view, stage } = setup(400, 400);
        view.render(openState(longSolution));
        const thumb = scrollThumb(stage)!;
        const cursor = () => stage.container().style.cursor;

        thumb.fire('mouseenter');
        expect(cursor()).toBe('grab');
        thumb.fire('dragstart');
        expect(cursor()).toBe('grabbing');
        thumb.fire('dragend');
        expect(cursor()).toBe('grab');
        thumb.fire('mouseleave');
        expect(cursor()).toBe('default');
    });

    it('keeps the grabbing cursor if the pointer leaves the thumb mid-drag', () => {
        const { view, stage } = setup(400, 400);
        view.render(openState(longSolution));
        const thumb = scrollThumb(stage)!;
        vi.spyOn(thumb, 'isDragging').mockReturnValue(true);

        thumb.fire('dragstart');
        thumb.fire('mouseleave');
        expect(stage.container().style.cursor).toBe('grabbing');
    });

    it('does nothing when no handlers are set', () => {
        stage = createStage(800, 600);
        const view = new WrongAnswerPopUpView(stage);
        view.render(openState(shortSolution));
        expect(() => overlayRect(stage!).fire('click')).not.toThrow();
    });
});

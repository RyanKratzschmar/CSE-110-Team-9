// @vitest-environment jsdom

// Tests that explanations and solution steps are mathematically correct for each equation type. (Darsh)

import 'vitest-canvas-mock';
import Konva from 'konva';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WrongAnswerPopUpController } from '../frontend/src/wrongAnswerExplanationPopUp/controller/WrongAnswerPopUpController';
import { WrongAnswerPopUpModel, type WrongAnswerPopUpState } from '../frontend/src/wrongAnswerExplanationPopUp/model/WrongAnswerPopUpModel';
import { WrongAnswerPopUpView, type WrongAnswerPopUpViewHandlers } from '../frontend/src/wrongAnswerExplanationPopUp/view/WrongAnswerPopUpView';
import { LongDivisionExplanation } from '../backend/equations/wrongAnswerExplanation/LongDivisionExplanation';
import { LongMultiplicationExplanation } from '../backend/equations/wrongAnswerExplanation/LongMultiplicationExplanation';
import { assertWholeNumber, capitalize, digitsLeastFirst, GridBuilder, isCellVisible, placeName, plural, WorkedSolutionBase, type CellKind, type ExplanationStep, type WorkCell, type WorkedSolution, type WorkLayout } from '../backend/equations/wrongAnswerExplanation/wrongAnswerExplanation';

//Black Box Tests

//Controller Tests

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

//Explainers Tests

describe('LongMultiplicationExplanation (black box)', () => {
    it.each([[123, 45, 5535], [12, 3, 36], [0, 987, 0], [987, 0, 0], [1, 1, 1], [99, 99, 9801], [12, 102, 1224], [987654, 123456, 121931812224]])('%i × %i = %i', (a, b, expected) => {
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

    it.each([[-1, 5], [5, -1], [1.5, 2], [2, 0.25], [Number.NaN, 2], [Number.POSITIVE_INFINITY, 2]])('rejects %d × %d as not whole numbers', (a, b) => {
        expect(() => new LongMultiplicationExplanation(a, b)).toThrow(RangeError);
        expect(() => new LongMultiplicationExplanation(a, b)).toThrow(/must be a whole number/);
    });

    it('rejects products too large to compute exactly', () => {
        expect(() => new LongMultiplicationExplanation(Number.MAX_SAFE_INTEGER, 2)).toThrow(/too large/);
    });
});

describe('LongDivisionExplanation (black box)', () => {
    it.each([[156, 12, 13], [408, 4, 102], [0, 5, 0], [81, 9, 9], [7, 7, 1], [7, 1, 7], [1000, 8, 125], [123456, 3, 41152]])('%i ÷ %i = %i', (dividend, divisor, expected) => {
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

    it.each([[-12, 4], [12, -4], [12.5, 5], [12, 1.5]])('rejects %d ÷ %d as not whole numbers', (dividend, divisor) => {
        expect(() => new LongDivisionExplanation(dividend, divisor)).toThrow(/must be a whole number/);
    });
});

//Model Tests

const multiplicationSolution = new LongMultiplicationExplanation(123, 45).explain();

describe('WrongAnswerPopUpModel (black box)', () => {
    it('starts closed with no solution and no scroll', () => {
        expect(new WrongAnswerPopUpModel().getState()).toEqual({ isOpen: false, solution: null, scrollY: 0 });
    });

    it('opens with the given solution scrolled to the top', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(multiplicationSolution);
        expect(model.getState()).toEqual({ isOpen: true, solution: multiplicationSolution, scrollY: 0 });
    });

    it('closes after being opened', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(multiplicationSolution);
        model.close();
        expect(model.getState().isOpen).toBe(false);
    });

    it('scrolls within 0 and the maximum scroll', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(multiplicationSolution);

        model.scrollTo(50, 100);
        expect(model.getState().scrollY).toBe(50);

        model.scrollTo(500, 100);
        expect(model.getState().scrollY).toBe(100);

        model.scrollTo(-20, 100);
        expect(model.getState().scrollY).toBe(0);
    });

    it('scrolls relative to the current position', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(multiplicationSolution);
        model.scrollBy(30, 100);
        model.scrollBy(30, 100);
        expect(model.getState().scrollY).toBe(60);
        model.scrollBy(-100, 100);
        expect(model.getState().scrollY).toBe(0);
    });

    it('resets the scroll when opened again', () => {
        const model = new WrongAnswerPopUpModel();
        model.open(multiplicationSolution);
        model.scrollTo(80, 100);
        model.open(multiplicationSolution);
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

        model.open(multiplicationSolution);
        expect(listener).toHaveBeenLastCalledWith(model.getState());

        unsubscribe();
        model.close();
        expect(listener).toHaveBeenCalledTimes(1);
    });
});

//Gray Box Tests

//Layout Tests

const multiplications: [number, number][] = [];
for (let a = 0; a <= 1200; a += 97) {
    for (const b of [0, 1, 7, 10, 45, 102, 999, 4060]) {
        multiplications.push([a, b]);
    }
}

const divisions: [number, number][] = [];
for (let divisor = 1; divisor <= 25; divisor += 3) {
    for (const quotient of [0, 1, 9, 10, 102, 407, 1000, 3456]) {
        divisions.push([quotient * divisor, divisor]);
    }
}

const solutions: [string, WorkedSolution][] = [...multiplications.map(([a, b]): [string, WorkedSolution] => [`${a} × ${b}`, new LongMultiplicationExplanation(a, b).explain()]), ...divisions.map(([n, d]): [string, WorkedSolution] => [`${n} ÷ ${d}`, new LongDivisionExplanation(n, d).explain()])];

describe('layout invariants for every explanation (gray box)', () => {
    it.each(solutions)('%s keeps every cell and line inside the grid', (_, { layout }) => {
        for (const cell of layout.cells) {
            expect(cell.row).toBeGreaterThanOrEqual(0);
            expect(cell.row).toBeLessThan(layout.rows);
            expect(cell.col).toBeGreaterThanOrEqual(0);
            expect(cell.col).toBeLessThan(layout.columns);
            expect(cell.text).toHaveLength(1);
        }
        for (const line of layout.lines) {
            expect(line.fromCol).toBeGreaterThanOrEqual(0);
            expect(line.toCol).toBeLessThan(layout.columns);
            expect(line.fromCol).toBeLessThanOrEqual(line.toCol);
            expect(line.fromOffset).toBeGreaterThanOrEqual(0);
            expect(line.fromOffset).toBeLessThan(1);
        }
    });

    it.each(solutions)('%s only uses step numbers that have a matching explanation step', (_, { layout, steps }) => {
        for (const item of [...layout.cells, ...layout.lines]) {
            expect(item.step).toBeGreaterThanOrEqual(0);
            expect(item.step).toBeLessThan(steps.length);
        }
    });

    it.each(solutions)('%s never draws two visible cells in the same place', (_, { layout, steps }) => {
        for (let step = 0; step < steps.length; step++) {
            const taken = new Set<string>();
            for (const cell of layout.cells.filter((c) => isCellVisible(c, step))) {
                const key = `${cell.row},${cell.col}`;
                expect(taken.has(key), `step ${step} overlaps at ${key}`).toBe(false);
                taken.add(key);
            }
        }
    });

    it.each(solutions)('%s shows something new in every working step', (_, { layout, steps, operation }) => {
        const workingSteps = operation === 'long-division' ? steps.length - 1 : steps.length;
        for (let step = 0; step < workingSteps; step++) {
            expect(layout.cells.some((c) => c.step === step), `step ${step}`).toBe(true);
        }
    });
});

describe('long multiplication rows (gray box)', () => {
    it.each(multiplications)('%i × %i writes each partial product and the answer', (a, b) => {
        const { layout, steps, answer } = new LongMultiplicationExplanation(a, b).explain();
        const multiplierDigits = String(b).split('').reverse().map(Number);
        const last = steps.length - 1;

        multiplierDigits.forEach((digit, place) => {
            const expected = digit === 0 ? '0' : String(a * digit) + '0'.repeat(place);
            expect(rowText(layout, last, 3 + place)).toBe(expected);
        });
        expect(rowText(layout, last, layout.rows - 1)).toBe(String(answer));
    });

    it.each(multiplications)('%i × %i only shows non-zero carries, in row 0, during the step that makes them', (a, b) => {
        const { layout } = new LongMultiplicationExplanation(a, b).explain();
        for (const carry of layout.cells.filter((c) => c.kind === 'carry')) {
            expect(carry.row).toBe(0);
            expect(carry.transient).toBe(true);
            expect(Number(carry.text)).toBeGreaterThan(0);
        }
        expect(rowText(layout, 0, 0, ['carry'])).toBe('');
    });
});

describe('long division rows (gray box)', () => {
    it.each(divisions)('%i ÷ %i writes the quotient above the dividend', (dividend, divisor) => {
        const { layout, steps, answer } = new LongDivisionExplanation(dividend, divisor).explain();
        expect(rowText(layout, steps.length - 1, 0)).toBe(String(answer));
    });

    it.each(divisions.filter(([dividend]) => dividend > 0))('%i ÷ %i finishes with a remainder of 0 on the bottom row', (dividend, divisor) => {
        const { layout, steps } = new LongDivisionExplanation(dividend, divisor).explain();
        const bottom = rowText(layout, steps.length - 1, layout.rows - 1);
        expect(bottom).toMatch(/^0+$/);
    });

    it.each(divisions)('%i ÷ %i adds exactly one quotient digit per working step', (dividend, divisor) => {
        const { layout, steps } = new LongDivisionExplanation(dividend, divisor).explain();
        for (let step = 1; step < steps.length - 1; step++) {
            expect(layout.cells.filter((c) => c.row === 0 && c.step === step)).toHaveLength(1);
        }
    });
});

//Popup Tests

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

//White Box Tests

//Long Division Tests

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
        expect(step.details).toEqual(['1 × 12 = 12, and 2 × 12 = 24 is too big.', 'Subtract: 15 − 12 = 3.', '3 is less than 12, so 1 is the right digit.']);
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
        expect(step.details).toEqual(['Bring down the next digit, 0, to make 0.', '4 is already bigger than 0, so 4 goes into it 0 times.', 'Write 0 in the quotient and keep going.']);
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

//Long Multiplication Tests

describe('LongMultiplicationExplanation steps (white box)', () => {
    const { steps } = new LongMultiplicationExplanation(123, 45).explain();

    it('explains multi-digit multipliers in the set-up step', () => {
        expect(steps[0].details).toEqual(['Multiply 123 by each digit of 45, starting with the ones digit.', 'Each digit gives one row (a partial product). Add the rows at the end.']);
    });

    it('writes the ones row with carries', () => {
        expect(steps[1].title).toBe('Multiply by the ones digit (5)');
        expect(steps[1].description).toBe('Multiply 123 by 5, the ones digit of 45, working from right to left.');
        expect(steps[1].details).toEqual(['5 × 3 = 15 → write 5, carry 1', '5 × 2 + 1 carried = 11 → write 1, carry 1', '5 × 1 + 1 carried = 6 → write 6', 'Row: 615']);
    });

    it('adds placeholder zeros for rows past the ones place', () => {
        expect(steps[2].title).toBe('Multiply by the tens digit (4)');
        expect(steps[2].description).toBe('The 4 is in the tens place, so it is worth 40. Write 1 placeholder zero on the right first, then multiply 123 by 4.');
        expect(steps[2].details).toEqual(['4 × 3 = 12 → write 2, carry 1', '4 × 2 + 1 carried = 9 → write 9', '4 × 1 = 4 → write 4', 'Row: 492 plus 1 placeholder zero → 4920']);
    });

    it('adds the partial products column by column and states the answer', () => {
        expect(steps[3].title).toBe('Add the partial products');
        expect(steps[3].description).toBe('Add 615 + 4920 column by column, starting with the ones column.');
        expect(steps[3].details).toEqual(['Ones: 5 + 0 = 5 → write 5', 'Tens: 1 + 2 = 3 → write 3', 'Hundreds: 6 + 9 = 15 → write 5, carry 1', 'Thousands: 4 + 1 carried = 5 → write 5', '123 × 45 = 5535']);
    });

    it('writes the whole total for the last multiplicand digit instead of carrying', () => {
        expect(new LongMultiplicationExplanation(99, 5).explain().steps[1].details).toEqual(['5 × 9 = 45 → write 5, carry 4', '5 × 9 + 4 carried = 49 → write 49', 'Row: 495', '99 × 5 = 495']);
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
        expect(carries).toEqual([[1, 3, '1', true], [1, 2, '1', true], [2, 3, '1', true], [3, 1, '1', true]]);
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

//Model Tests

const divisionSolution = new LongDivisionExplanation(156, 12).explain();

function openModel(): WrongAnswerPopUpModel {
    const model = new WrongAnswerPopUpModel();
    model.open(divisionSolution);
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
        expect(model.getState()).toEqual({ isOpen: false, solution: divisionSolution, scrollY: 40 });
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
        model.open(divisionSolution);
        expect(first).toHaveBeenCalledOnce();
        expect(second).toHaveBeenCalledOnce();
    });

    it('subscribing the same listener twice only registers it once', () => {
        const model = new WrongAnswerPopUpModel();
        const listener = vi.fn();
        model.subscribe(listener);
        model.subscribe(listener);
        model.open(divisionSolution);
        expect(listener).toHaveBeenCalledOnce();
    });
});

//Shared Tests

function cell(step: number, transient: boolean): WorkCell {
    return { row: 0, col: 0, text: '1', kind: 'carry', step, transient };
}

describe('placeName', () => {
    it('names the known places', () => {
        expect(placeName(0)).toBe('ones');
        expect(placeName(1)).toBe('tens');
        expect(placeName(3)).toBe('thousands');
        expect(placeName(15)).toBe('quadrillions');
    });

    it('falls back to a power of ten past the end of the list', () => {
        expect(placeName(16)).toBe('10^16');
    });
});

describe('isCellVisible', () => {
    it('shows a non-transient cell from its own step onwards', () => {
        expect(isCellVisible(cell(2, false), 1)).toBe(false);
        expect(isCellVisible(cell(2, false), 2)).toBe(true);
        expect(isCellVisible(cell(2, false), 5)).toBe(true);
    });

    it('shows a transient cell only during its own step', () => {
        expect(isCellVisible(cell(2, true), 1)).toBe(false);
        expect(isCellVisible(cell(2, true), 2)).toBe(true);
        expect(isCellVisible(cell(2, true), 3)).toBe(false);
    });
});

describe('capitalize', () => {
    it('upper-cases only the first letter', () => {
        expect(capitalize('ten-thousands')).toBe('Ten-thousands');
    });

    it('handles an empty string', () => {
        expect(capitalize('')).toBe('');
    });
});

describe('plural', () => {
    it('uses the singular only for exactly 1', () => {
        expect(plural(1, 'time')).toBe('1 time');
        expect(plural(0, 'time')).toBe('0 times');
        expect(plural(2, 'placeholder zero')).toBe('2 placeholder zeros');
    });
});

describe('assertWholeNumber', () => {
    it.each([0, 1, Number.MAX_SAFE_INTEGER])('accepts %d', (value) => {
        expect(() => assertWholeNumber(value, 'n')).not.toThrow();
    });

    it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])('rejects %d', (value) => {
        expect(() => assertWholeNumber(value, 'n')).toThrow(`n must be a whole number (0 or more), got ${value}.`);
    });
});

describe('digitsLeastFirst', () => {
    it('lists digits starting with the ones digit', () => {
        expect(digitsLeastFirst(120)).toEqual([0, 2, 1]);
        expect(digitsLeastFirst(0)).toEqual([0]);
    });
});

describe('GridBuilder', () => {
    it('builds an empty layout with no rows, using minColumns for the width', () => {
        expect(new GridBuilder().build()).toEqual({ rows: 0, columns: 0, cells: [], lines: [] });
        expect(new GridBuilder().build(4).columns).toBe(4);
    });

    it('defaults transient to false and fromOffset to 0', () => {
        const g = new GridBuilder();
        g.cell({ row: 0, col: 0, text: '1', kind: 'digit', step: 0 });
        g.line({ row: 0, fromCol: 0, toCol: 0, edge: 'bottom', step: 0 });
        const layout = g.build();
        expect(layout.cells[0].transient).toBe(false);
        expect(layout.lines[0].fromOffset).toBe(0);
    });

    it('keeps explicit transient and fromOffset values', () => {
        const g = new GridBuilder();
        g.cell({ row: 0, col: 0, text: '1', kind: 'carry', step: 1, transient: true });
        g.line({ row: 0, fromCol: 0, toCol: 0, edge: 'top', step: 0, fromOffset: 0.55 });
        const layout = g.build();
        expect(layout.cells[0].transient).toBe(true);
        expect(layout.lines[0].fromOffset).toBe(0.55);
    });

    it('right-aligns text so its last character lands in rightCol, and returns the left column', () => {
        const g = new GridBuilder();
        expect(g.rightAligned(2, 5, '123', 'digit', 1)).toBe(3);
        expect(g.build().cells.map((c) => [c.row, c.col, c.text])).toEqual([[2, 3, '1'], [2, 4, '2'], [2, 5, '3']]);
    });

    it('grows the grid to fit both cells and lines', () => {
        const g = new GridBuilder();
        g.cell({ row: 1, col: 2, text: '1', kind: 'digit', step: 0 });
        g.line({ row: 4, fromCol: 0, toCol: 6, edge: 'bottom', step: 0 });
        const layout = g.build();
        expect(layout.rows).toBe(5);
        expect(layout.columns).toBe(7);
    });

    it('uses minColumns only when it is wider than the content', () => {
        const g = new GridBuilder();
        g.cell({ row: 0, col: 5, text: '1', kind: 'digit', step: 0 });
        expect(g.build(3).columns).toBe(6);
        expect(g.build(10).columns).toBe(10);
    });
});

describe('WorkedSolutionBase', () => {
    class CountingSolution extends WorkedSolutionBase {
        readonly operation = 'long-multiplication' as const;
        readonly operatorSymbol = '×' as const;
        readonly operands = [6, 7] as const;
        readonly answer = 42;
        stepBuilds = 0;
        layoutBuilds = 0;

        protected buildSteps(): ExplanationStep[] {
            this.stepBuilds++;
            return [];
        }

        protected buildLayout(): WorkLayout {
            this.layoutBuilds++;
            return new GridBuilder().build();
        }
    }

    it('builds the problem text from the operands and operator', () => {
        expect(new CountingSolution().explain().problemText).toBe('6 × 7');
    });

    it('builds the solution once and returns the cached object afterwards', () => {
        const solution = new CountingSolution();
        const first = solution.explain();
        expect(solution.explain()).toBe(first);
        expect(solution.stepBuilds).toBe(1);
        expect(solution.layoutBuilds).toBe(1);
    });
});

//View Tests

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
    it.each([[1000, 800, 70, 20, 860, 760], [320, 400, 10, 16, 300, 368], [250, 300, 0, 0, 250, 300]])('on a %ix%i stage puts the panel at (%i, %i) sized %ix%i', (sw, sh, x, y, w, h) => {
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

//Helpers

function createStage(width = 800, height = 600): Konva.Stage {
    const container = document.createElement('div');
    document.body.appendChild(container);
    return new Konva.Stage({ container, width, height });
}

function destroyStage(stage: Konva.Stage): void {
    const container = stage.container();
    stage.destroy();
    container.remove();
}

function rowText(layout: WorkLayout, step: number, row: number, kinds: readonly CellKind[] = ['digit', 'placeholder']): string {
    return layout.cells.filter((c) => c.row === row && kinds.includes(c.kind) && isCellVisible(c, step)).sort((a, b) => a.col - b.col).map((c) => c.text).join('');
}

function popupLayer(stage: Konva.Stage): Konva.Layer {
    return stage.getLayers()[0];
}

function panelGroup(stage: Konva.Stage): Konva.Group {
    return popupLayer(stage).getChildren()[1] as Konva.Group;
}

function overlayRect(stage: Konva.Stage): Konva.Rect {
    return popupLayer(stage).getChildren()[0] as Konva.Rect;
}

function contentGroup(stage: Konva.Stage): Konva.Group {
    const viewport = popupLayer(stage).findOne((n: Konva.Node) => n instanceof Konva.Group && n.clipWidth() > 0) as Konva.Group;
    return viewport.getChildren()[0] as Konva.Group;
}

function scrollThumb(stage: Konva.Stage): Konva.Rect | undefined {
    return popupLayer(stage).findOne((n: Konva.Node) => n instanceof Konva.Rect && n.draggable()) as Konva.Rect | undefined;
}

function closeButton(stage: Konva.Stage): Konva.Group {
    return (popupLayer(stage).findOne('Circle') as Konva.Circle).getParent() as Konva.Group;
}

function stepLabels(stage: Konva.Stage): string[] {
    return popupLayer(stage)
        .find('Text')
        .map((t) => (t as Konva.Text).text())
        .filter((text) => /^STEP \d+$/.test(text));
}

function pressKey(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    window.dispatchEvent(event);
    return event;
}

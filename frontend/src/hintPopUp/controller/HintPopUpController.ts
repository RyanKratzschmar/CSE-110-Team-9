import type Konva from 'konva';
import { HintPopUpModel } from '../model/HintPopUpModel';
import { HintPopUpView } from '../view/HintPopUpView';
import type { HintData, HintProvider } from '../../../../backend/equations/hints/hint';
import { LongDivisionHint } from '../../../../backend/equations/hints/LongDivisionHint';
import { LongMultiplicationHint } from '../../../../backend/equations/hints/LongMultiplicationHint';

const LINE_SCROLL = 60;

export class HintPopUpController {
    private readonly model = new HintPopUpModel();
    private readonly view: HintPopUpView;
    private readonly unsubscribe: () => void;

    constructor(stage: Konva.Stage) {
        this.view = new HintPopUpView(stage);
        this.view.setHandlers({
            onScrollBy: (dy) => this.model.scrollBy(dy, this.view.getMaxScroll()),
            onScrollTo: (y) => this.model.scrollTo(y, this.view.getMaxScroll()),
            onClose: () => this.model.close(),
        });
        this.unsubscribe = this.model.subscribe((state) => this.view.render(state));
        window.addEventListener('keydown', this.handleKeyDown);
    }

    showLongDivisionHint(dividend: number, divisor: number): void {
        this.show(new LongDivisionHint(dividend, divisor));
    }

    showLongMultiplicationHint(multiplicand: number, multiplier: number): void {
        this.show(new LongMultiplicationHint(multiplicand, multiplier));
    }

    show(hint: HintProvider | HintData): void {
        const data = 'getHint' in hint ? hint.getHint() : hint;
        this.model.open(data);
    }

    close(): void {
        this.model.close();
    }

    isOpen(): boolean {
        return this.model.getState().isOpen;
    }

    handleResize(): void {
        this.view.refresh();
        this.model.scrollBy(0, this.view.getMaxScroll());
    }

    destroy(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        this.unsubscribe();
        this.view.destroy();
    }

    private readonly handleKeyDown = (event: KeyboardEvent): void => {
        if (!this.isOpen()) {
            return;
        }

        const max = this.view.getMaxScroll();
        const page = this.view.getViewportHeight() * 0.9;

        switch (event.key) {
            case 'ArrowDown':
                this.model.scrollBy(LINE_SCROLL, max);
                break;
            case 'ArrowUp':
                this.model.scrollBy(-LINE_SCROLL, max);
                break;
            case ' ':
            case 'PageDown':
                this.model.scrollBy(page, max);
                break;
            case 'PageUp':
                this.model.scrollBy(-page, max);
                break;
            case 'Home':
                this.model.scrollTo(0, max);
                break;
            case 'End':
                this.model.scrollTo(max, max);
                break;
            case 'Escape':
                this.model.close();
                break;
            default:
                return;
        }
        event.preventDefault();
    };
}

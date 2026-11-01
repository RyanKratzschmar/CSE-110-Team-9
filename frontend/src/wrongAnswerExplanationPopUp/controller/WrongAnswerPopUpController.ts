import type Konva from 'konva';
import { WrongAnswerPopUpModel } from '../model/WrongAnswerPopUpModel';
import { WrongAnswerPopUpView } from '../view/WrongAnswerPopUpView';
import type { WrongAnswerExplainer } from '../../../../backend/equations/wrongAnswerExplanation/wrongAnswerExplanation';
import { LongDivisionExplanation } from '../../../../backend/equations/wrongAnswerExplanation/LongDivisionExplanation';
import { LongMultiplicationExplanation } from '../../../../backend/equations/wrongAnswerExplanation/LongMultiplicationExplanation';

const LINE_SCROLL = 60;

//Connects the pop-up model and view, and handles keyboard input
export class WrongAnswerPopUpController {
    private readonly model = new WrongAnswerPopUpModel();
    private readonly view: WrongAnswerPopUpView;
    private readonly unsubscribe: () => void;

    //Creates the view on the given stage, wires up its handlers and starts listening to the keyboard
    constructor(stage: Konva.Stage) {
        this.view = new WrongAnswerPopUpView(stage);
        this.view.setHandlers({onScrollBy: (dy) => this.model.scrollBy(dy, this.view.getMaxScroll()), onScrollTo: (y) => this.model.scrollTo(y, this.view.getMaxScroll()), onClose: () => this.model.close()});
        this.unsubscribe = this.model.subscribe((state) => this.view.render(state));
        window.addEventListener('keydown', this.handleKeyDown);
    }

    //Opens the pop-up with the worked solution for dividend ÷ divisor
    showLongDivisionExplanation(dividend: number, divisor: number): void {
        this.show(new LongDivisionExplanation(dividend, divisor));
    }

    //Opens the pop-up with the worked solution for multiplicand × multiplier
    showLongMultiplicationExplanation(multiplicand: number, multiplier: number): void {
        this.show(new LongMultiplicationExplanation(multiplicand, multiplier));
    }

    //Opens the pop-up with the worked solution from any explainer
    show(explainer: WrongAnswerExplainer): void {
        this.model.open(explainer.explain());
    }

    //Closes the pop-up
    close(): void {
        this.model.close();
    }

    //Returns whether the pop-up is currently open
    isOpen(): boolean {
        return this.model.getState().isOpen;
    }

    //Redraws the pop-up for the new stage size and keeps the scroll position in range
    handleResize(): void {
        this.view.refresh();
        this.model.scrollBy(0, this.view.getMaxScroll());
    }

    //Stops listening to the keyboard and removes the pop-up from the stage
    destroy(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        this.unsubscribe();
        this.view.destroy();
    }

    //Scrolls or closes the pop-up from the arrow keys, Space, Page Up/Down, Home, End and Escape
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

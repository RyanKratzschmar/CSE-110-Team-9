import type { HintData } from '../../../../backend/equations/hints/hint';

export interface HintPopUpState {
    readonly isOpen: boolean;
    readonly hint: HintData | null;
    readonly scrollY: number;
}

export type HintPopUpListener = (state: HintPopUpState) => void;

export class HintPopUpModel {
    private state: HintPopUpState = { isOpen: false, hint: null, scrollY: 0 };
    private readonly listeners = new Set<HintPopUpListener>();

    getState(): HintPopUpState {
        return this.state;
    }

    subscribe(listener: HintPopUpListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    open(hint: HintData): void {
        this.setState({ isOpen: true, hint, scrollY: 0 });
    }

    close(): void {
        if (!this.state.isOpen) {
            return;
        }
        this.setState({ isOpen: false });
    }

    scrollTo(y: number, maxScroll: number): void {
        if (!this.state.isOpen) {
            return;
        }
        const clamped = Math.max(0, Math.min(Math.max(0, maxScroll), y));
        if (clamped !== this.state.scrollY) {
            this.setState({ scrollY: clamped });
        }
    }

    scrollBy(dy: number, maxScroll: number): void {
        this.scrollTo(this.state.scrollY + dy, maxScroll);
    }

    private setState(patch: Partial<HintPopUpState>): void {
        this.state = { ...this.state, ...patch };
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
}

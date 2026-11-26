import type { HintData } from '../../../../backend/equations/hints/hint';

export interface HintPopUpState {
    readonly isOpen: boolean;
    readonly hint: HintData | null;
    readonly scrollY: number;
    readonly currentStepIndex: number;
    readonly unlockedStepCount: number;
}

export type HintPopUpListener = (state: HintPopUpState) => void;

export class HintPopUpModel {
    private state: HintPopUpState = {
        isOpen: false,
        hint: null,
        scrollY: 0,
        currentStepIndex: 0,
        unlockedStepCount: 1,
    };
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
        const isSameProblem =
            this.state.hint !== null &&
            this.state.hint.problemText === hint.problemText &&
            this.state.hint.operation === hint.operation;

        if (isSameProblem) {
            this.setState({ isOpen: true, hint, scrollY: 0 });
        } else {
            this.setState({
                isOpen: true,
                hint,
                scrollY: 0,
                currentStepIndex: 0,
                unlockedStepCount: 1,
            });
        }
    }

    close(): void {
        if (!this.state.isOpen) {
            return;
        }
        this.setState({ isOpen: false });
    }

    nextStep(): void {
        if (!this.state.isOpen || !this.state.hint) {
            return;
        }
        const total = this.state.hint.steps.length;
        if (this.state.currentStepIndex < total - 1) {
            const nextIndex = this.state.currentStepIndex + 1;
            const nextUnlocked = Math.max(this.state.unlockedStepCount, nextIndex + 1);
            this.setState({
                currentStepIndex: nextIndex,
                unlockedStepCount: nextUnlocked,
                scrollY: 0,
            });
        }
    }

    prevStep(): void {
        if (!this.state.isOpen || !this.state.hint) {
            return;
        }
        if (this.state.currentStepIndex > 0) {
            this.setState({
                currentStepIndex: this.state.currentStepIndex - 1,
                scrollY: 0,
            });
        }
    }

    goToStep(index: number): void {
        if (!this.state.isOpen || !this.state.hint) {
            return;
        }
        const total = this.state.hint.steps.length;
        const clamped = Math.max(0, Math.min(this.state.unlockedStepCount - 1, Math.min(total - 1, index)));
        if (clamped !== this.state.currentStepIndex) {
            this.setState({
                currentStepIndex: clamped,
                scrollY: 0,
            });
        }
    }

    reset(): void {
        this.setState({
            isOpen: false,
            hint: null,
            scrollY: 0,
            currentStepIndex: 0,
            unlockedStepCount: 1,
        });
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

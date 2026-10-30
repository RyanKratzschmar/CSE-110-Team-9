import type { WorkedSolution } from '../wrongAnswerExplanationPopUp';

export interface WrongAnswerPopUpState {
    readonly isOpen: boolean;
    readonly solution: WorkedSolution | null;
    readonly scrollY: number;
}

export type WrongAnswerPopUpListener = (state: WrongAnswerPopUpState) => void;

const CLOSED_STATE: WrongAnswerPopUpState = Object.freeze({ isOpen: false, solution: null, scrollY: 0 });

const MAX_NOTIFY_ROUNDS = 100;

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
    if (value === null || typeof value !== 'object' || seen.has(value)) {
        return value;
    }
    seen.add(value);
    Object.freeze(value);
    for (const child of Object.values(value)) {
        deepFreeze(child, seen);
    }
    return value;
}

export class WrongAnswerPopUpModel {
    private state: WrongAnswerPopUpState = CLOSED_STATE;
    private readonly listeners = new Set<WrongAnswerPopUpListener>();
    private readonly awaitingFirstState = new Set<WrongAnswerPopUpListener>();
    private notifying = false;
    private pendingNotify = false;

    getState(): WrongAnswerPopUpState {
        return this.state;
    }

    subscribe(listener: WrongAnswerPopUpListener): () => void {
        const subscription: WrongAnswerPopUpListener = (state) => listener(state);
        this.listeners.add(subscription);
        if (this.notifying) {
            this.awaitingFirstState.add(subscription);
        } else {
            this.notify(subscription);
        }
        return () => {
            this.listeners.delete(subscription);
            this.awaitingFirstState.delete(subscription);
        };
    }

    open(solution: WorkedSolution): void {
        if (this.state.isOpen && this.state.solution === solution) {
            return;
        }
        this.setState({ isOpen: true, solution: deepFreeze(solution), scrollY: 0 });
    }

    close(): void {
        if (!this.state.isOpen) {
            return;
        }
        this.setState(CLOSED_STATE);
    }

    scrollTo(y: number, maxScroll: number): void {
        if (!this.state.isOpen || Number.isNaN(y) || !Number.isFinite(maxScroll)) {
            return;
        }
        const clamped = Math.max(0, Math.min(Math.max(0, maxScroll), y));
        if (clamped !== this.state.scrollY) {
            this.setState({ ...this.state, scrollY: clamped });
        }
    }

    scrollBy(dy: number, maxScroll: number): void {
        this.scrollTo(this.state.scrollY + dy, maxScroll);
    }

    private setState(next: WrongAnswerPopUpState): void {
        this.state = Object.freeze({ ...next });
        if (this.notifying) {
            this.pendingNotify = true;
            return;
        }
        this.notifying = true;
        try {
            let rounds = 0;
            do {
                if (++rounds > MAX_NOTIFY_ROUNDS) {
                    console.error(`WrongAnswerPopUpModel stopped notifying after ${MAX_NOTIFY_ROUNDS} rounds; a listener keeps changing the state.`);
                    break;
                }
                this.pendingNotify = false;
                for (const listener of [...this.listeners]) {
                    if (this.pendingNotify) {
                        break;
                    }
                    if (this.listeners.has(listener)) {
                        this.awaitingFirstState.delete(listener);
                        this.notify(listener);
                    }
                }
                for (const listener of this.awaitingFirstState) {
                    if (this.pendingNotify) {
                        break;
                    }
                    this.awaitingFirstState.delete(listener);
                    this.notify(listener);
                }
            } while (this.pendingNotify);
        } finally {
            this.notifying = false;
            this.pendingNotify = false;
            this.awaitingFirstState.clear();
        }
    }

    private notify(listener: WrongAnswerPopUpListener): void {
        try {
            listener(this.state);
        } catch (error) {
            console.error('WrongAnswerPopUpModel listener threw:', error);
        }
    }
}

import type { WorkedSolution } from '../wrongAnswerExplanationPopUp';

export interface WrongAnswerPopUpState {
  readonly isOpen: boolean;
  readonly solution: WorkedSolution | null;
  readonly scrollY: number;
}

export type WrongAnswerPopUpListener = (state: WrongAnswerPopUpState) => void;

export class WrongAnswerPopUpModel {
  private state: WrongAnswerPopUpState = { isOpen: false, solution: null, scrollY: 0 };
  private readonly listeners = new Set<WrongAnswerPopUpListener>();

  getState(): WrongAnswerPopUpState {
    return this.state;
  }

  subscribe(listener: WrongAnswerPopUpListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  open(solution: WorkedSolution): void {
    this.setState({ isOpen: true, solution, scrollY: 0 });
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

  private setState(patch: Partial<WrongAnswerPopUpState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

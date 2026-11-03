import type { WorkedSolution } from '../../../../backend/equations/wrongAnswerExplanation/wrongAnswerExplanation';

//What the pop-up is showing: whether it is open, which solution, and how far it is scrolled
export interface WrongAnswerPopUpState {
  readonly isOpen: boolean;
  readonly solution: WorkedSolution | null;
  readonly scrollY: number;
}

export type WrongAnswerPopUpListener = (state: WrongAnswerPopUpState) => void;

//Holds the pop-up state and notifies listeners whenever it changes
export class WrongAnswerPopUpModel {
  private state: WrongAnswerPopUpState = { isOpen: false, solution: null, scrollY: 0 };
  private readonly listeners = new Set<WrongAnswerPopUpListener>();

  //Returns the current state
  getState(): WrongAnswerPopUpState {
    return this.state;
  }

  //Registers a listener for state changes and returns a function that removes it
  subscribe(listener: WrongAnswerPopUpListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  //Opens the pop-up with the given solution, scrolled to the top
  open(solution: WorkedSolution): void {
    this.setState({ isOpen: true, solution, scrollY: 0 });
  }

  //Closes the pop-up (does nothing if it is already closed)
  close(): void {
    if (!this.state.isOpen) {
      return;
    }
    this.setState({ isOpen: false });
  }

  //Scrolls to y, kept between 0 and maxScroll (only while the pop-up is open)
  scrollTo(y: number, maxScroll: number): void {
    if (!this.state.isOpen) {
      return;
    }
    const clamped = Math.max(0, Math.min(Math.max(0, maxScroll), y));
    if (clamped !== this.state.scrollY) {
      this.setState({ scrollY: clamped });
    }
  }

  //Scrolls by dy from the current position, kept between 0 and maxScroll
  scrollBy(dy: number, maxScroll: number): void {
    this.scrollTo(this.state.scrollY + dy, maxScroll);
  }

  //Merges the patch into the state and notifies every listener
  private setState(patch: Partial<WrongAnswerPopUpState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

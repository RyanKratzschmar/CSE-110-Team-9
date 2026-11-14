import type { LeaderboardEntry } from "../../../backend/game/Leaderboard/Leaderboard";

export interface LeaderboardScreenState {
    readonly leaderboard: readonly LeaderboardEntry[];
    readonly scrollY: number;
    readonly loading: boolean;
}

export type LeaderboardScreenListener = (state: LeaderboardScreenState) => void;

//Holds the leaderboard entries and scroll position, and notifies listeners whenever they change
export class LeaderboardScreenModel {
    private state: LeaderboardScreenState = { leaderboard: [], scrollY: 0, loading: true };
    private readonly listeners = new Set<LeaderboardScreenListener>();

    //Returns the current state
    getState(): LeaderboardScreenState {
        return this.state;
    }

    //Registers a listener for state changes and returns a function that removes it
    subscribe(listener: LeaderboardScreenListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    //Replaces the entries (sorted in descending order) and scrolls back to the top
    setEntries(entries: readonly LeaderboardEntry[]): void {
        this.setState({ leaderboard: entries, scrollY: 0, loading: false });
    }

    //Clears the entries, scrolls to the top, and shows the loading message
    setLoading(): void {
        this.setState({ leaderboard: [], scrollY: 0, loading: true });
    }

    //Scrolls to y, kept between 0 and maxScroll
    scrollTo(y: number, maxScroll: number): void {
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
    private setState(patch: Partial<LeaderboardScreenState>): void {
        this.state = { ...this.state, ...patch };
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
}
export type FloorEntry = { gameNumber: number; floor: number };

//The leaderboard will contain entries of the finished games and the highest floor cleared in each one (0 if no floors were cleared)
export class FloorLeaderboard {
    private readonly entries: FloorEntry[] = [];

    //Adds a finished game, numbered in the order games were finished
    recordGame(floor: number): void {
        this.entries.push({ gameNumber: this.entries.length + 1, floor });
    }

    //Sorts by floor in descending order; tied games are listed earliest first
    getSorted(): FloorEntry[] {
        return [...this.entries].sort((a, b) => b.floor - a.floor || a.gameNumber - b.gameNumber);
    }
}
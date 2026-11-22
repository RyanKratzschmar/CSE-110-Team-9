export type FloorEntry = { timestamp: string; floor: number };

// Floors reached during one run of the game
export class FloorLeaderboard {
    private readonly entries: FloorEntry[] = [];

    //Adds a floor along with its timestamp
    recordFloor(floor: number): void {
        if (this.entries.some((e) => e.floor === floor)) {
            return;
        }
        
        this.entries.push({ floor, timestamp: new Date().toISOString() });
    }

    //Sorts the entries so that the floors are in descending order
    getSorted(): FloorEntry[] {
        return [...this.entries].sort((a, b) => b.floor - a.floor);
    }
}
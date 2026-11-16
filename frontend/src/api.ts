// Fetch helpers for the game API.
export interface RunResponse {
    id: string;
    player: { hp: number; maxHp: number; attack: number; defense: number };
    level: number;
    currentIndex: number;
    nodes: { type: "combat" | "rest"; cleared: boolean }[];
    gameOver: boolean;
}

export async function createRun(): Promise<RunResponse> {
    const response = await fetch("/api/runs", { method: "POST" });

    if (!response.ok) {
        throw new Error("Could not start a new run");
    }

    return response.json();
}

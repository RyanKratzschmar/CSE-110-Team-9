import { existsSync, readFileSync, writeFileSync } from "node:fs";

export type LeaderboardEntry = { timestamp: string; score: number};
const LEADERBOARD_FILE = new URL("./leaderboard.json", import.meta.url);

// Reads all leaderboard entries from leaderboard.json, or returns an empty array if the file doesn't exist.
function loadLeaderboard() : LeaderboardEntry[] {
    if (!existsSync(LEADERBOARD_FILE)) {
        return [];
    }
    const text = readFileSync(LEADERBOARD_FILE, "utf8");
    return JSON.parse(text) as LeaderboardEntry[];
}

// Writes the given leaderboard entries to leaderboard.json, overwriting what was there.
function saveLeaderboard(entries: LeaderboardEntry[]): void {
    const jsonString = JSON.stringify(entries);
    writeFileSync(LEADERBOARD_FILE, jsonString, "utf8");
}

// Returns all leaderboard entries sorted by scores in descending order.
export function getSortedLeaderboard(): LeaderboardEntry[] {
    const entries = loadLeaderboard();
    return entries.sort((a, b) => b.score - a.score);
}

// Adds a new score entry to the leaderboard and saves it to leaderboard.json.
export function addScore(entry: LeaderboardEntry): void {
    const entries = loadLeaderboard();
    entries.push(entry);
    saveLeaderboard(entries);
}
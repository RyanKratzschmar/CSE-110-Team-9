import { existsSync, readFileSync, writeFileSync } from "node:fs";

export type LeaderboardEntry = { timestamp: string; score: number};
const LEADERBOARD_FILE = new URL("./leaderboard.json", import.meta.url);

function loadLeaderboard() : LeaderboardEntry[] {
    if (!existsSync(LEADERBOARD_FILE)) {
        return [];
    }
    const text = readFileSync(LEADERBOARD_FILE, "utf8");
    return JSON.parse(text) as LeaderboardEntry[];
}

function saveLeaderboard(entries: LeaderboardEntry[]): void {
    const jsonString = JSON.stringify(entries);
    writeFileSync(LEADERBOARD_FILE, jsonString, "utf8");
}

export function getSortedLeaderboard(): LeaderboardEntry[] {
    const entries = loadLeaderboard();
    return entries.sort((a, b) => b.score - a.score);
}

export function addScore(entry: LeaderboardEntry): void {
    const entries = loadLeaderboard();
    entries.push(entry);
    saveLeaderboard(entries);
}
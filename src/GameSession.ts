// GameSession: holds the one game every screen shares; "New Game" swaps in a fresh GameState.
import { GameState } from "../backend/game/GameState.ts";
import { FloorLeaderboard } from "../backend/game/Leaderboard/FloorLeaderboard.ts";

export class GameSession {
	private current = new GameState();
	private gameInProgress = false;
	readonly leaderboard = new FloorLeaderboard();

	get state(): GameState {
		return this.current;
	}

	newGame(): void {
		this.current = new GameState();
		this.gameInProgress = true;
	}

	// Function is called when the Game Over Screen opens; counts each started game exactly once.
	// The current floor isn't finished yet, so the highest floor cleared is the one before it.
	recordFinishedGame(): void {
		if (!this.gameInProgress) {
			return;
		}
		this.gameInProgress = false;
		this.leaderboard.recordGame(this.current.level.number - 1);
	}
}
// GameSession: holds the one game every screen shares; "New Game" swaps in a fresh GameState.
import { GameState } from "../backend/game/GameState.ts";

export class GameSession {
	private current = new GameState();

	get state(): GameState {
		return this.current;
	}

	newGame(): void {
		this.current = new GameState();
	}
}
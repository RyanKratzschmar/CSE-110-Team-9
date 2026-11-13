// GameState: all data for one run: the Player, the current Level, and whether the game is over.
import { Level } from "./Level";
import type { NodeType } from "./LevelNode";
import { Player } from "./Player";
import type { Combat } from "./Combat";

// What the frontend receives (see the API table in the README)
export interface GameStateJSON {
  player: { hp: number; maxHp: number; attack: number; defense: number };
  level: number;
  currentIndex: number;
  nodes: { type: NodeType; cleared: boolean }[];
  gameOver: boolean;
}

export class GameState {
  readonly player = new Player();
  level = new Level(1);
  gameOver = false;
  // Preserve the current fight between requests
  combat: Combat | null = null;
  // Identify the fight so submissions from an old fight can be rejected
  combatId: string | null = null;

  toJSON(): GameStateJSON {
    return {
      player: {
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        attack: this.player.attack,
        defense: this.player.defense,
      },
      level: this.level.number,
      currentIndex: this.level.currentIndex,
      nodes: this.level.nodes.map((node) => ({ type: node.type, cleared: node.cleared })),
      gameOver: this.gameOver,
    };
  }
}
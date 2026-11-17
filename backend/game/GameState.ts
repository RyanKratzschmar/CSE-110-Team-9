// GameState: all data for one run: the Player, the current Level, and whether the game is over.
import { Level } from "./Level";
import type { NodeType } from "./LevelNode";
import { Player } from "./Player";
import type { UpgradeMinigame } from "./UpgradeMinigame";
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
  upgradeMinigame: UpgradeMinigame | null = null;
  upgradeMinigameLevel: number | null = null;
  upgradeClaimedLevel: number | null = null;
  // Preserve the fight when switching screens.
  combat: Combat | null = null;

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
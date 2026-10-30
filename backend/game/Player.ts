// Player: the player's Health and attack stats. (Sally)
import { Health } from "./Health";

export class Player {
  private health: Health;
  private attackPower: number;

  constructor(maxHp = 100, attack = 10) {
    if (!Number.isInteger(attack) || attack < 0) {
      throw new Error("Attack must be a whole number of 0 or more");
    }
    this.health = new Health(maxHp);
    this.attackPower = attack;
  }

  get hp(): number {
    return this.health.value;
  }

  get maxHp(): number {
    return this.health.max;
  }

  get attack(): number {
    return this.attackPower;
  }

  takeDamage(amount: number): void {
    if (amount < 0) throw new Error("Damage can't be negative");
    this.health.updateHealth(-amount);
  }

  healFull(): void {
    this.health.healFull();
  }

  isDead(): boolean {
    return this.health.isZero();
  }
}
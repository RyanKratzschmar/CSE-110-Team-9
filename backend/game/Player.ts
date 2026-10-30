// Player: the player's Health, attack, and defense stats. (Sally)
import { Health } from "./Health";

export class Player {
  private health: Health;
  private attackPower: number; // attackPower per auto attack
  private defenseRate: number; // defense multiplier from 0 to 1: percent incoming damage blocked

  constructor(maxHp = 100, attack = 10, defense = 0.1) {
    if (!Number.isInteger(attack) || attack < 0) {
      throw new Error("Attack must be a whole number of 0 or more");
    }
    if (!(defense >= 0 && defense < 1)) {
      throw new Error("Defense must be at least 0 and less than 1");
    }
    this.health = new Health(maxHp);
    this.attackPower = attack;
    this.defenseRate = defense;
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

  get defense(): number {
    return this.defenseRate;
  }

  // amount is the attacker's raw damage; defense reduces it, but any hit does at least 1
  takeDamage(amount: number): void {
    if (amount < 0) throw new Error("Damage can't be negative");
    if (amount === 0) return;
    const reduced = Math.max(1, Math.round(amount * (1 - this.defenseRate)));
    this.health.updateHealth(-reduced);
  }

  healFull(): void {
    this.health.healFull();
  }

  isDead(): boolean {
    return this.health.isZero();
  }
}
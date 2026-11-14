// Monster (abstract): an enemy with Health and attack damage that scale with difficulty.
import { Health } from "./Health";

export class Monster {
    private health: Health;
    private attackPower: number;

    constructor(maxHp: number, attack: number) {
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

    takeDamage(amount: number) : void {
        if (amount < 0) throw new Error("Damage can't be negative");
        this.health.updateHealth(-amount);
    }

    isDead(): boolean {
        return this.health.isZero();
    }
    
}
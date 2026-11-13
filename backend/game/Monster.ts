// Monster: an enemy's independent health and attack stats. Subclasses can choose stats by difficulty.
import { Health } from "./Health";

export class Monster {
    private health: Health;
    private attackPower: number;

    // Health validates maxHp. Constructing it here prevents monsters from sharing HP.
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

    /** Applies non-negative damage; Health clamps HP at zero and rejects non-finite changes. */
    takeDamage(amount: number) : void {
        if (amount < 0) throw new Error("Damage can't be negative");
        this.health.updateHealth(-amount);
    }

    /** Uses the same death-checking interface as Player. */
    isDead(): boolean {
        return this.health.isZero();
    }
    
}

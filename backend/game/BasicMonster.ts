// BasicMonster: the standard enemy for sprint 1 fights; extends Monster.

import { Monster } from "./Monster";

export class BasicMonster extends Monster {
    constructor(difficulty = 1) {
        if (!Number.isSafeInteger(difficulty) || difficulty < 1) {
            throw new Error("Difficulty must be a positive whole number");
        }
        // Initial balance: each level adds 10 HP and 2 attack.
        super(50 + (difficulty - 1) * 10, 15 + (difficulty - 1) * 2);
    }
}

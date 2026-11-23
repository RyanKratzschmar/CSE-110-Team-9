import { describe, expect, it } from "vitest";
import { BasicMonster } from "../backend/game/BasicMonster";
import { Combat } from "../backend/game/Combat";
import { Player } from "../backend/game/Player";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";

describe("BasicMonster fight length", () => {
    it.each([[1, 3], [2, 4], [3, 5]])(
        "floor %i takes %i correct attacks with the starting attack stat",
        (floor, requiredAttacks) => {
            const player = new Player();
            const combat = new Combat(player, new BasicMonster(floor), floor, () =>
                new MultiplicationEquation(0, [2, "*", 3], 6));

            for (let attack = 1; attack <= requiredAttacks; attack++) {
                const result = combat.resolveAnswer(6, combat.currentQuestion().questionId);
                expect(result?.correct).toBe(true);
                expect(result?.result).toBe(attack === requiredAttacks ? "win" : "ongoing");
                combat.startNextQuestion();
            }

            expect(combat.getEnemyHp()).toBe(0);
            expect(player.hp).toBe(player.maxHp);
        },
    );
});

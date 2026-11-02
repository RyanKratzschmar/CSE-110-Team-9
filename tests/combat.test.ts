// Tests damage on right/wrong answers, HP never below 0, and win/loss detection. (David)

import { describe, expect, it } from "vitest";
import { Combat } from "../backend/game/Combat";
import { Player } from "../backend/game/Player";
import { Monster } from "../backend/game/Monster";
import { Health } from "../backend/game/Health";
import { L } from "vitest/dist/chunks/reporters.nr4dxCkA.js";

describe("Cobmat", () => {
    function createCombat() {
        const player = new Player(100, 20);
        const enemy = new Monster(new Health(50), 15);
        const combat = new Combat(player, enemy);

        return { player, enemy, combat };
    }

    it("starts active with the supplied player and enemy HP", () => {
        const { combat } = createCombat();

        expect(combat.getGameStatus()).toBe("active");
        expect(combat.getPlayerHp()).toBe(100);
        expect(combat.getEnemyHp()).toBe(50);
    });

    it("damages only the enemy after a correct answer", () => {
        const { combat, enemy } = createCombat();
        
        combat.resolveAnswer(true);

        expect(combat.getEnemyHp()).toBe(30);
        expect(enemy.hp).toBe(30);
        expect(combat.getPlayerHp()).toBe(100);
        expect(combat.getGameStatus()).toBe("active");
    });

    it("damages only the player after an incorrect answer", () => {
        const { combat, player } = createCombat();

        combat.resolveAnswer(false);

        expect(combat.getPlayerHp()).toBe(85);
        expect(player.hp).toBe(85);
        expect(combat.getEnemyHp()).toBe(50);
        expect(combat.getGameStatus()).toBe("active");
    });

    it.each([true, false])(
        "ignores duiplicate submissions after answering %s",
        (answer) => {
            const { combat } = createCombat();

            combat.resolveAnswer(answer);
            const playerHp = combat.getPlayerHp();
            const enemyHp = combat.getEnemyHp();
            
            combat.resolveAnswer(answer);
            combat.resolveAnswer(!answer);

            expect(combat.getPlayerHp()).toBe(playerHp);
            expect(combat.getEnemyHp()).toBe(enemyHp);
        },
    );

    it("allows another answer after preparing a new question", () => {
        const { combat } = createCombat();

        combat.resolveAnswer(true);
        combat.setQuestionResolvedToFalse();
        combat.resolveAnswer(false);

        expect(combat.getEnemyHp()).toBe(30);
        expect(combat.getPlayerHp()).toBe(85);
        expect(combat.getGameStatus()).toBe("active");
    });

    it.each([50, 80])(
        "wins with %s damage and never drops enemy Hp below zero",
        (attack) => {
            const player = new Player(100, attack);
            const enemy = new Monster(new Health(50), 15);
            const combat = new Combat(player, enemy);

            combat.resolveAnswer(true);
        },
    );

    it.each([100, 150])(
        "loses with %s incoming damage and never drops player HP below zero",
        (attack) => {
            const player = new Player(100, 20);
            const enemy = new Monster(new Health(50), attack);
            const combat = new Combat(player, enemy);

            combat.resolveAnswer(false);

            expect(combat.getPlayerHp()).toBe(0);
            expect(combat.getEnemyHp()).toBe(50);
            expect(combat.getGameStatus()).toBe("lost");
        },
    );

    it("cannot restart or apply more damage after winning", () => {
        const player = new Player(100, 50);
        const enemy = new Monster(new Health(50), 15);
        const combat = new Combat(player, enemy);

        combat.resolveAnswer(true);
        combat.setQuestionResolvedToFalse();
        combat.resolveAnswer(false);

        expect(combat.getGameStatus()).toBe("won");
        expect(combat.getPlayerHp()).toBe(100);
        expect(combat.getEnemyHp()).toBe(0);
    });

    it("cannot restart or apply more damage after losing", () => {
        const player = new Player(100, 20);
        const enemy = new Monster(new Health(50), 100);
        const combat = new Combat(player, enemy);

        combat.resolveAnswer(false);
        combat.setQuestionResolvedToFalse();
        combat.resolveAnswer(true);

        expect(combat.getGameStatus()).toBe("lost");
        expect(combat.getPlayerHp()).toBe(0);
        expect(combat.getEnemyHp()).toBe(50);
    });

    it("starts lost if the supplied player is already dead", () => {
        const player = new Player(100, 20);
        player.takeDamage(100);
        const enemy = new Monster(new Health(50), 15);
        const combat = new Combat(player, enemy);

        expect(combat.getGameStatus()).toBe("lost");

        combat.resolveAnswer(true);
        expect(combat.getEnemyHp()).toBe(50);
    });

    it("starts won if the supplied enemy is already defeated", () => {
        const player = new Player(100, 20);
        const enemy = new Monster(new Health(50), 15);
        enemy.takeDamage(50);
        const combat = new Combat(player, enemy);

        expect(combat.getGameStatus()).toBe("won");
        
        combat.resolveAnswer(false);
        expect(combat.getPlayerHp()).toBe(100);
    });
});
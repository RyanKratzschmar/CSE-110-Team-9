// Tests damage on right/wrong answers, HP never below 0, and win/loss detection. (David)

import { describe, expect, it } from "vitest";
import { Combat } from "../backend/game/Combat";
import { Player } from "../backend/game/Player";
import { Monster } from "../backend/game/Monster";
import { Health } from "../backend/game/Health";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";
import { a } from "vitest/dist/chunks/suite.B2jumIFP.js";

describe("Cobmat", () => {
    function createCombat() {
        const player = new Player(100, 20, 0);
        const enemy = new Monster(new Health(50), 15);
        const combat = new Combat(player, enemy, fixedEquation);
         
        return { player, enemy, combat };
    }

    function fixedEquation() {
        return new MultiplicationEquation(
            true, "10 * 20 = ", 200, [10, "*", 20]
        );
    }


    it("starts active with the supplied player and enemy HP", () => {
        const { combat } = createCombat();

        expect(combat.getGameStatus()).toBe("active");
        expect(combat.getPlayerHp()).toBe(100);
        expect(combat.getEnemyHp()).toBe(50);
    });

    it("damages only the enemy after a correct answer", () => {
        const { combat} = createCombat();
        const { questionId } = combat.currentQuestion();

        const result = combat.resolveAnswer(200, questionId);

        expect(combat.getEnemyHp()).toBe(30);
        expect(combat.getPlayerHp()).toBe(100);
        expect(result?.correct).toBe(true);
    });

    it("damages only the player after an incorrect answer", () => {
        const { combat } = createCombat();
        const { questionId } = combat.currentQuestion();
        
        const result = combat.resolveAnswer(201, questionId);

        expect(result?.correct).toBe(false);
        expect(combat.getPlayerHp()).toBe(85);
        expect(combat.getEnemyHp()).toBe(50);
    });

    it.each([200, 201])(
        "ignores duiplicate submissions after answering %s",
        (answer) => {
            const { combat } = createCombat();
            const { questionId } = combat.currentQuestion();

            combat.resolveAnswer(answer, questionId);
            const playerHp = combat.getPlayerHp();
            const enemyHp = combat.getEnemyHp();
    
            expect(combat.resolveAnswer(answer, questionId)).toBeUndefined();
            expect(
                combat.resolveAnswer(answer === 200 ? 201 : 200, questionId)
            ).toBeUndefined();

            expect(combat.getPlayerHp()).toBe(playerHp);
            expect(combat.getEnemyHp()).toBe(enemyHp);
        }
    );

    it("allows another answer after preparing a new question", () => {
        const { combat } = createCombat();
        const first = combat.currentQuestion();

        combat.resolveAnswer(200, first.questionId);
        combat.startNextQuestion();
        
        const next = combat.currentQuestion();
        expect(next.questionId).toBe(first.questionId + 1);

        combat.resolveAnswer(201, next.questionId);

        expect(combat.getEnemyHp()).toBe(30);
        expect(combat.getPlayerHp()).toBe(85);
        expect(combat.getGameStatus()).toBe("active");
    });

    it.each([50, 80])(
        "wins with %s damage and never drops enemy Hp below zero",
        (attack) => {
            const player = new Player(100, attack, 0);
            const enemy = new Monster(new Health(50), 15);
            const combat = new Combat(player, enemy, fixedEquation);
            const { questionId } = combat.currentQuestion();

            const result = combat.resolveAnswer(200, questionId)
            
            expect(result?.result).toBe("win");;
            expect(combat.getEnemyHp()).toBe(0);
            expect(combat.getPlayerHp()).toBe(100);
            expect(combat.getGameStatus()).toBe("won");
        }
    );

    it.each([100, 150])(
        "loses with %s incoming damage and never drops player HP below zero",
        (attack) => {
            const player = new Player(100, 20, 0);
            const enemy = new Monster(new Health(50), attack);
            const combat = new Combat(player, enemy, fixedEquation);
            const { questionId } = combat.currentQuestion();

            const result = combat.resolveAnswer(201, questionId);
            
            expect(result?.result).toBe("lose");
            expect(combat.getPlayerHp()).toBe(0);
            expect(combat.getEnemyHp()).toBe(50);
            expect(combat.getGameStatus()).toBe("lost");
        }
    );

    it("cannot restart or apply more damage after winning", () => {
        const player = new Player(100, 50, 0);
        const enemy = new Monster(new Health(50), 15);
        const combat = new Combat(player, enemy, fixedEquation);
        const { questionId } = combat.currentQuestion();

        combat.resolveAnswer(200, questionId);
        combat.startNextQuestion();

        expect(combat.resolveAnswer(201, questionId)).toBeUndefined();
        expect(combat.currentQuestion().questionId).toBe(questionId);
        expect(combat.getGameStatus()).toBe("won");
        expect(combat.getPlayerHp()).toBe(100);
        expect(combat.getEnemyHp()).toBe(0);
    });

    it("cannot restart or apply more damage after losing", () => {
        const player = new Player(100, 20, 0);
        const enemy = new Monster(new Health(50), 100);
        const combat = new Combat(player, enemy, fixedEquation);
        const { questionId } = combat.currentQuestion();
         
        combat.resolveAnswer(201, questionId);
        combat.startNextQuestion();

        expect(combat.resolveAnswer(200, questionId)).toBeUndefined();
        expect(combat.currentQuestion().questionId).toBe(questionId);
        expect(combat.getGameStatus()).toBe("lost");
        expect(combat.getPlayerHp()).toBe(0);
        expect(combat.getEnemyHp()).toBe(50);
    });

    it("starts lost if the supplied player is already dead", () => {
        const player = new Player(100, 20, 0);
        player.takeDamage(100);
        const enemy = new Monster(new Health(50), 15);
        const combat = new Combat(player, enemy, fixedEquation);
        const { questionId } = combat.currentQuestion();
         
        expect(combat.getGameStatus()).toBe("lost");
        expect(combat.resolveAnswer(200, questionId)).toBeUndefined();
        expect(combat.getEnemyHp()).toBe(50);
    });

    it("starts won if the supplied enemy is already defeated", () => {
        const player = new Player(100, 20, 0);
        const enemy = new Monster(new Health(50), 15);
        enemy.takeDamage(50);
        const combat = new Combat(player, enemy, fixedEquation);
        const { questionId } = combat.currentQuestion();

        expect(combat.getGameStatus()).toBe("won");
        expect(combat.resolveAnswer(201, questionId)).toBeUndefined();
        expect(combat.getPlayerHp()).toBe(100);
    });
});
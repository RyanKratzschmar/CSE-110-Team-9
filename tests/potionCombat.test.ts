// Tests moving between actions without being attacked, the attack question not changing, HP updating, and the potion leaving the inventory. (Arushi)
import { describe, expect, it } from "vitest";
import { Combat } from "../backend/game/Combat";
import { Player } from "../backend/game/Player";
import { Monster } from "../backend/game/Monster";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";
import type { Potion } from "../backend/game/Potion";

describe("Potion Combat", () => {
    function fixedEquation() {
        return new MultiplicationEquation(true, "10 * 20 = ", 200, [10, "*", 20]);
    }

    function createCombatWithPotions(potions: Potion[] = [{ type: "healing", level: "basic" }]) {
        const player = new Player(100, 20, 0); // 0 defense for straightforward damage math
        const enemy = new Monster(50, 15);
        player.inventory.push(...potions);
        const combat = new Combat(player, enemy, fixedEquation);
        return { player, enemy, combat };
    }

    it("allows player to view/cancel without being attacked or losing health", () => {
        const { player, enemy, combat } = createCombatWithPotions();
        const initialPlayerHp = combat.getPlayerHp();
        const initialEnemyHp = combat.getEnemyHp();
        const question1 = combat.currentQuestion();

        // Inspecting or returning between actions without resolving an answer or using potion
        const question2 = combat.currentQuestion();

        expect(combat.getPlayerHp()).toBe(initialPlayerHp);
        expect(combat.getEnemyHp()).toBe(initialEnemyHp);
        expect(player.inventory.length).toBe(1);
        expect(question2.questionId).toBe(question1.questionId);
    });

    it("makes sure question for attack screen does not change after inspecting/moving actions", () => {
        const { combat } = createCombatWithPotions();
        const firstView = combat.currentQuestion();

        // Simulate moving back and forth between screens
        const secondView = combat.currentQuestion();
        expect(secondView.questionId).toBe(firstView.questionId);
        expect(secondView.question).toBe(firstView.question);
    });

    it("makes sure question for attack screen does not change even after using a potion", () => {
        const { combat, player } = createCombatWithPotions();
        player.takeDamage(40); // HP now 60
        const questionBefore = combat.currentQuestion();

        combat.usePotion(0); // Player drinks potion, enemy attacks

        const questionAfter = combat.currentQuestion();
        expect(questionAfter.questionId).toBe(questionBefore.questionId);
        expect(questionAfter.question).toBe(questionBefore.question);
    });

    it("heals the player and removes the potion from inventory, followed by enemy attack", () => {
        const { player, combat } = createCombatWithPotions([
            { type: "healing", level: "basic" }, // heals 20% of 100 = 20 HP
        ]);
        player.takeDamage(50); // HP: 50
        expect(player.hp).toBe(50);
        expect(player.inventory.length).toBe(1);

        const result = combat.usePotion(0);

        expect(result).toBeDefined();
        expect(result?.healed).toBe(20); // 50 -> 70
        expect(result?.damageTaken).toBe(15); // Enemy attack is 15 (70 - 15 = 55)
        expect(combat.getPlayerHp()).toBe(55);
        expect(player.inventory.length).toBe(0); // Potion removed
    });

    it("handles advanced potions healing more (30% max HP)", () => {
        const { player, combat } = createCombatWithPotions([
            { type: "healing", level: "advanced" }, // heals 30% of 100 = 30 HP
        ]);
        player.takeDamage(50); // HP: 50
        const result = combat.usePotion(0);

        expect(result?.healed).toBe(30); // 50 -> 80
        expect(combat.getPlayerHp()).toBe(65); // 80 - 15 = 65
        expect(player.inventory.length).toBe(0);
    });

    it("caps healing at max HP", () => {
        const { player, combat } = createCombatWithPotions([
            { type: "healing", level: "advanced" }, // heals 30 HP
        ]);
        player.takeDamage(10); // HP: 90
        const result = combat.usePotion(0);

        // Can only heal 10 (capped at 100), then enemy deals 15 damage -> 85
        expect(result?.healed).toBe(10);
        expect(combat.getPlayerHp()).toBe(85);
    });

    it("returns undefined and does nothing when using a potion with an empty inventory", () => {
        const { player, combat } = createCombatWithPotions([]);
        player.takeDamage(20);
        const hpBefore = combat.getPlayerHp();

        const result = combat.usePotion(0);

        expect(result).toBeUndefined();
        expect(combat.getPlayerHp()).toBe(hpBefore);
    });

    it("sets combat status to lost if enemy counter-attack kills the player", () => {
        const { player, combat } = createCombatWithPotions([
            { type: "healing", level: "basic" }, // heals 20
        ]);
        player.takeDamage(95); // HP: 5
        // Basic potion heals 20 (HP = 25). If enemy attack was >= 25, player dies.
        // Let's damage player more so after +20 heal, enemy's 15 damage still kills them:
        // Actually at 5 HP + 20 heal = 25 HP. Enemy does 15, leaves 10.
        // If HP is 1: 1 + 20 = 21. Let's make enemy attack lethal by using higher damage:
        player.takeDamage(4); // HP: 1
        // Heal 20 -> 21.
        // Let's test with a 30 damage enemy:
        const lethalEnemy = new Monster(50, 30);
        const lethalCombat = new Combat(player, lethalEnemy, fixedEquation);
        const result = lethalCombat.usePotion(0);

        expect(result?.result).toBe("lose");
        expect(lethalCombat.getGameStatus()).toBe("lost");
    });
});


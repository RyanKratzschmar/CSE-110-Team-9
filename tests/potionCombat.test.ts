// Tests moving between actions without being attacked, the attack question not changing, HP updating, and the potion leaving the inventory. (Arushi)
import { describe, expect, it } from "vitest";
import { Combat } from "../backend/game/Combat";
import { Player } from "../backend/game/Player";
import { Monster } from "../backend/game/Monster";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";
import type { Potion } from "../backend/game/Potion";
import { PotionLab } from "../backend/game/PotionLab";
import { MultiOperationEquation } from "../backend/equations/MultiOperationEquation";

describe("Potion Combat", () => {
    function fixedEquation() {
        return new MultiplicationEquation(1, [10, "*", 20], 200);
    }

    function createCombatWithPotions(potions: Potion[] = [{ type: "healing", level: "basic" }]) {
        const player = new Player(100, 20, 0); // 0 defense for straightforward damage math
        const enemy = new Monster(50, 15);
        player.inventory.push(...potions);
        const combat = new Combat(player, enemy, 1, fixedEquation);
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

    it.each([
        ["basic", 1, 30],
        ["advanced", 1, 40],
        ["basic", 2, 40],
        ["advanced", 2, 50],
    ] as const)("%s potion heals %i upgrades later for %i HP", (level, upgrades, expectedHeal) => {
        const { player, combat } = createCombatWithPotions([{ type: "healing", level }]);
        for (let i = 0; i < upgrades; i++) player.applyUpgrade();
        player.takeDamage(80);
        const question = combat.currentQuestion();

        const result = combat.usePotion(0);

        expect(result?.healed).toBe(expectedHeal);
        expect(player.inventory).toHaveLength(0);
        expect(combat.currentQuestion().questionId).toBe(question.questionId);
    });

    it("caps upgraded potion healing at the player's missing HP", () => {
        const { player, combat } = createCombatWithPotions();
        player.applyUpgrade();
        player.takeDamage(10);
        expect(combat.usePotion(0)?.healed).toBe(10);
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
        const lethalCombat = new Combat(player, lethalEnemy, 1, fixedEquation);
        const result = lethalCombat.usePotion(0);

        expect(result?.result).toBe("lose");
        expect(lethalCombat.getGameStatus()).toBe("lost");
    });
});

describe("Strength and poison potions", () => {
    function fixedEquation() {
        return new MultiplicationEquation(1, [10, "*", 20], 200); // answer 200
    }

    // Player: 100 HP, 20 attack, 0 defense. Enemy: 100 HP, 15 attack.
    function setup(potions: Potion[], enemyHp = 100) {
        const player = new Player(100, 20, 0);
        const enemy = new Monster(enemyHp, 15);
        player.inventory.push(...potions);
        const combat = new Combat(player, enemy, 1, fixedEquation);
        return { player, enemy, combat };
    }

    // Answers the current question (right or wrong) and moves on to the next one
    function answer(combat: Combat, correct: boolean) {
        const result = combat.resolveAnswer(correct ? 200 : 1, combat.currentQuestion().questionId);
        combat.startNextQuestion();
        return result;
    }

    it("a strength potion doesn't heal; the enemy still attacks", () => {
        const { player, combat } = setup([{ type: "strength", level: "basic" }]);
        player.takeDamage(50);

        const result = combat.usePotion(0);

        expect(result?.healed).toBe(0);
        expect(result?.strengthRounds).toBe(1);
        expect(result?.damageTaken).toBe(15);
        expect(player.hp).toBe(35);
        expect(player.inventory).toHaveLength(0);
    });

    it("a basic strength potion doubles damage for the next answer only", () => {
        const { enemy, combat } = setup([{ type: "strength", level: "basic" }]);
        combat.usePotion(0);

        const boosted = answer(combat, true);
        expect(boosted?.strengthBoosted).toBe(true);
        expect(enemy.hp).toBe(60); // 100 - 20 x 2

        const normal = answer(combat, true);
        expect(normal?.strengthBoosted).toBe(false);
        expect(enemy.hp).toBe(40); // 60 - 20
    });

    it("an advanced strength potion lasts 2 answers", () => {
        const { enemy, combat } = setup([{ type: "strength", level: "advanced" }]);
        combat.usePotion(0);
        answer(combat, true);
        answer(combat, true);
        answer(combat, true);
        expect(enemy.hp).toBe(100 - 40 - 40 - 20);
        expect(combat.getActiveEffects().strengthRounds).toBe(0);
    });

    it("a wrong answer uses up a strength round without boosting anything", () => {
        const { enemy, combat } = setup([{ type: "strength", level: "basic" }]);
        combat.usePotion(0);

        expect(answer(combat, false)?.strengthBoosted).toBe(false);
        answer(combat, true);
        expect(enemy.hp).toBe(80); // the boost is gone
    });

    it("strength potions stack their rounds", () => {
        const { combat } = setup([
            { type: "strength", level: "basic" },
            { type: "strength", level: "advanced" },
        ]);
        combat.usePotion(0);
        combat.usePotion(0);
        expect(combat.getActiveEffects().strengthRounds).toBe(3);
    });

    it("a basic poison potion hurts the enemy for 10% of its max HP after the next answer", () => {
        const { player, enemy, combat } = setup([{ type: "poison", level: "basic" }]);

        const drink = combat.usePotion(0);
        expect(drink?.healed).toBe(0);
        expect(drink?.poisonRounds).toBe(1);
        expect(enemy.hp).toBe(100); // no damage when drunk

        const first = answer(combat, false);
        expect(first?.poisonDamage).toBe(10);
        expect(enemy.hp).toBe(90);
        expect(player.hp).toBe(100 - 15 - 15); // counter-attack after drinking, then the wrong answer

        const second = answer(combat, false);
        expect(second?.poisonDamage).toBe(0);
        expect(enemy.hp).toBe(90);
    });

    it("an advanced poison potion lasts 2 answers", () => {
        const { enemy, combat } = setup([{ type: "poison", level: "advanced" }]);
        combat.usePotion(0);
        answer(combat, true); // 20 attack + 10 poison
        answer(combat, true); // 20 attack + 10 poison
        answer(combat, true); // 20 attack only
        expect(enemy.hp).toBe(100 - 30 - 30 - 20);
    });

    it("poison can finish off the enemy even after a wrong answer", () => {
        const { combat } = setup([{ type: "poison", level: "basic" }], 30);
        combat.usePotion(0);
        // Enemy max HP 30: poison does 10% = 3, at least 1
        combat["enemy"].takeDamage(28); // enemy at 2 HP

        const result = answer(combat, false);

        expect(result?.poisonDamage).toBe(2);
        expect(result?.result).toBe("win");
        expect(combat.getGameStatus()).toBe("won");
    });

    it("strength and poison together", () => {
        const { enemy, combat } = setup([
            { type: "strength", level: "basic" },
            { type: "poison", level: "basic" },
        ]);
        combat.usePotion(0);
        combat.usePotion(0);

        const result = answer(combat, true);

        expect(result?.strengthBoosted).toBe(true);
        expect(result?.poisonDamage).toBe(10);
        expect(enemy.hp).toBe(100 - 40 - 10);
    });
});

describe("Brewing, then drinking in combat", () => {
    it("a potion brewed in the lab is the one combat uses, and only that one is removed", () => {
        const player = new Player(100, 20, 0);
        // Fixed potion lab equation with answer 14
        const labEquation = () => new MultiOperationEquation(1, [2, "*", 6, "+", 18, "÷", 3, "-", 4], 14);
        for (const type of ["healing", "strength"] as const) {
            const lab = new PotionLab(player.inventory, labEquation);
            lab.chooseType(type);
            lab.chooseRecipe("basic");
            expect(lab.submit(14)).toBe(true);
        }
        const combat = new Combat(player, new Monster(100, 15), 1, () => new MultiplicationEquation(1, [10, "*", 20], 200));

        const result = combat.usePotion(1);

        expect(result?.potion).toEqual({ type: "strength", level: "basic" });
        expect(result?.healed).toBe(0);
        expect(combat.getActiveEffects().strengthRounds).toBe(1);
        expect(player.inventory).toEqual([{ type: "healing", level: "basic" }]);
    });
});

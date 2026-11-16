import { describe, expect, it } from "vitest";
import { CombatMainScreenModel } from "../src/screens/CombatMainScreen/CombatMainScreenModel";

describe("CombatMainScreenModel loading", () => {
    it("replaces local question and HP with server state, including maximum HP", () => {
        const model = new CombatMainScreenModel();
        model.setPlayerHealth(100);
        model.loadCombat({
            combatId: "saved-fight", questionId: 3, question: "4 x 5",
            playerHp: 73, playerMaxHp: 120, enemyHp: 30, enemyMaxHp: 80,
        });
        expect(model.getCombatId()).toBe("saved-fight");
        expect(model.getQuestionId()).toBe(3);
        expect(model.getQuestion()).toBe("4 x 5");
        expect(model.getPlayerHealth()).toBe(73);
        expect(model.getPlayerMaxHealth()).toBe(120);
        expect(model.getEnemyHealth()).toBe(30);
        expect(model.getEnemyMaxHealth()).toBe(80);
    });
});

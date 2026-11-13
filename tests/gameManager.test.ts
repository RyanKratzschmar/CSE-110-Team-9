import { describe, expect, it } from "vitest";
import { finishCombat, finishRest } from "../backend/game/GameManager";
import { GameState } from "../backend/game/GameState";
import { Combat } from "../backend/game/Combat";
import { Monster } from "../backend/game/Monster";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";

function createCombat(state: GameState, enemyAttack = 15) {
    return new Combat(state.player, new Monster(10, enemyAttack), () =>
        new MultiplicationEquation(true, "10 * 20 = ", 200, [10, "*", 20]));
}

describe("Combat progression with Sally's GameManager", () => {
    it("preserves player HP when a won fight advances the map", () => {
        const state = new GameState();
        const player = state.player;
        const combat = createCombat(state);
        combat.resolveAnswer(201, combat.currentQuestion().questionId);
        const remainingHp = player.hp;
        combat.startNextQuestion();
        const result = combat.resolveAnswer(200, combat.currentQuestion().questionId);
        expect(result?.result).toBe("win");
        finishCombat(state, "win");
        expect(state.player).toBe(player);
        expect(state.player.hp).toBe(remainingHp);
        expect(state.level.currentIndex).toBe(1);
        expect(createCombat(state).getPlayerHp()).toBe(remainingHp);
    });

    it("marks the run over after a lethal incorrect answer", () => {
        const state = new GameState();
        const combat = createCombat(state, 200);
        expect(combat.resolveAnswer(201, combat.currentQuestion().questionId)?.result).toBe("lose");
        finishCombat(state, "lose");
        expect(state.gameOver).toBe(true);
        expect(state.player.hp).toBe(0);
        expect(state.level.currentIndex).toBe(0);
        expect(state.level.nodes[0].cleared).toBe(false);
    });

    it("keeps healing separate from rest progression", () => {
        const state = new GameState();
        state.player.takeDamage(20);
        const remainingHp = state.player.hp;
        for (let stop = 0; stop < 3; stop += 1) finishCombat(state, "win");
        finishRest(state);
        expect(state.player.hp).toBe(remainingHp);
        expect(state.level.number).toBe(2);
        expect(state.level.currentIndex).toBe(0);
    });
});

import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../backend/app";
import { runStore } from "../backend/game/runStore";
import { Combat } from "../backend/game/Combat";
import { Monster } from "../backend/game/Monster";
import { MultiplicationEquation } from "../backend/equations/MultiplicationEquation";

function fixture(enemyHp = 50, attack = 15) {
    const id = runStore.create();
    const state = runStore.get(id)!;
    state.combatId = "test-fight";
    state.combat = new Combat(state.player, new Monster(enemyHp, attack), () =>
        new MultiplicationEquation(true, "10 * 20", 200, [10, "*", 20]));
    return { id, state, url: `/api/runs/${id}/combat` };
}

describe("Combat API", () => {
    it("creates a persistent fight without revealing the answer", async () => {
        const created = await request(app).post("/api/runs");
        const url = `/api/runs/${created.body.id}/combat`;
        const first = await request(app).get(url).expect(200);
        const second = await request(app).get(url).expect(200);
        expect(second.body).toEqual(first.body);
        expect(first.body).toMatchObject({ questionId: 1, playerHp: 100, enemyHp: 50 });
        expect(first.body.combatId).toEqual(expect.any(String));
        expect(first.body).not.toHaveProperty("correctAnswer");
    });

    it("applies damage once and rejects duplicate and old-fight answers", async () => {
        const { state, url } = fixture();
        const payload = { combatId: state.combatId, questionId: 1, answer: 200 };
        await request(app).post(`${url}/answer`).send(payload).expect(200);
        expect(state.combat!.getEnemyHp()).toBe(40);
        await request(app).post(`${url}/answer`).send(payload).expect(409);
        await request(app).post(`${url}/answer`).send({ ...payload, questionId: 2, combatId: "old" }).expect(409);
        const next = await request(app).get(url).expect(200);
        expect(next.body.questionId).toBe(2);
        expect(next.body.enemyHp).toBe(40);
    });

    it.each([{}, { answer: "200" }, { answer: null }, { answer: 200, questionId: 1.5, combatId: "test-fight" }])("rejects invalid submissions without damage: %j", async (payload) => {
        const { state, url } = fixture();
        await request(app).post(`${url}/answer`).send(payload).expect(400);
        expect(state.combat!.getEnemyHp()).toBe(50);
    });

    it.each(["win", "lose"] as const)("handles %s and rejects replay", async (result) => {
        const { state, url } = fixture(result === "win" ? 10 : 50, 200);
        const payload = { combatId: state.combatId, questionId: 1, answer: result === "win" ? 200 : 201 };
        const response = await request(app).post(`${url}/answer`).send(payload).expect(200);
        expect(response.body.result).toBe(result);
        expect(state.gameOver).toBe(result === "lose");
        expect(state.level.currentIndex).toBe(result === "win" ? 1 : 0);
        await request(app).post(`${url}/answer`).send(payload).expect(409);
        expect(state.level.currentIndex).toBe(result === "win" ? 1 : 0);
    });

    it("rejects missing runs, unopened fights, and combat at rest stops", async () => {
        await request(app).get("/api/runs/missing/combat").expect(404);
        await request(app).post("/api/runs/missing/combat/answer").send({}).expect(404);
        const id = runStore.create();
        await request(app).post(`/api/runs/${id}/combat/answer`).send({ answer: 1, questionId: 1, combatId: "missing" }).expect(409);
        const state = runStore.get(id)!;

        for (let i = 0; i < 3; i++) {
            state.level.completeCurrent();
        }
        await request(app).get(`/api/runs/${id}/combat`).expect(409);
    });
});

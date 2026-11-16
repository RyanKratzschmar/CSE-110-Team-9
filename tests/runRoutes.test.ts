import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../backend/app";

describe("Run API", () => {
    it("creates independent runs and retrieves their initial state", async () => {
        const first = await request(app).post("/api/runs").expect(201);
        const second = await request(app).post("/api/runs").expect(201);
        expect(first.body).toMatchObject({
            id: expect.any(String),
            player: { hp: 100, maxHp: 100, attack: 10, defense: 0.1 },
            level: 1, currentIndex: 0, gameOver: false,
            nodes: [
                { type: "combat", cleared: false },
                { type: "combat", cleared: false },
                { type: "combat", cleared: false },
                { type: "rest", cleared: false },
            ],
        });
        expect(second.body.id).not.toBe(first.body.id);
        const fetched = await request(app).get(`/api/runs/${first.body.id}`).expect(200);
        expect(fetched.body).toEqual(first.body);
    });

    it("returns JSON with 404 for an unknown run", async () => {
        const response = await request(app).get("/api/runs/missing").expect(404);
        expect(response.body).toEqual({ error: "Run not found" });
    });
});

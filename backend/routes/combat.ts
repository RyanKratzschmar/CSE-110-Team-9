// Combat routes: GET /api/runs/:id/combat (current question + HP), POST /api/runs/:id/combat/answer (check answer, apply damage). (David)

import { Router } from "express";
import { randomUUID } from "node:crypto";
import { runStore } from "../game/runStore";
import { Combat } from "../game/Combat";
import { BasicMonster } from "../game/BasicMonster";
import {
    GameFlowError,
    requireCurrentStop,
    finishCombat,
} from "../game/GameManager";

export const combatRouter = Router();

combatRouter.get("/:id/combat", (req, res) => {
    // find current run
    const state = runStore.get(req.params.id);
    if (!state) {
        res.status(404).json({ error: "Run not found "});
        return;
    }

    try {
        const node = requireCurrentStop(state, "combat");

        if (state.combat === null) {
            state.combat = new Combat(
                state.player,
                new BasicMonster(node.difficulty)
            );
            state.combatId = randomUUID();
        }

        res.json({
            combatId: state.combatId,
            ...state.combat.currentQuestion(),
        });
    } catch (error) {
        if (error instanceof GameFlowError) {
            res.status(409).json({ error: error.message });
            return;
        }

        throw error;
    }

})

combatRouter.post("/:id/combat/answer", (req, res, next) => {
    const state = runStore.get(req.params.id);
    if (!state) {
        res.status(404).json({ error: "Run not found" });
        return;
    }

    const { answer, questionId, combatId } = req.body ?? {};
    if ( !Number.isFinite(answer) ||
         !Number.isSafeInteger(questionId) ||
         questionId < 1 ||
         typeof combatId !== "string" ||
         combatId.trim().length === 0 ) {
            res.status(400).json({ 
                error: "Invalid answer, questionId, or combatId" });
            return;
        }
    // checks fight and process the answer
    try {
        // checks the game state
        requireCurrentStop(state, "combat");

        // checks for valid fight ID.
        if (state.combat === null || combatId !==
            state.combatId) {
                res.status(409).json({ error: "No matching active fight "});
                return;
            }
        // Process the answer with resolveAnswer()
        const result = state.combat.resolveAnswer(answer, questionId);
        
        // this is where undefined is useful
        if (result === undefined) {
            res.status(409).json({
                error: "Question already answered or no longer current"
            });
            return;
        }

        // updates progression on whether fight is still ongoing or over
        if (result.result === "ongoing") {
            state.combat.startNextQuestion();
        } else {
            finishCombat(state, result.result);
            state.combat = null;
            state.combatId = null;
        }

        // returns the result to frontend
        res.json({ combatId, ...result });
    } catch (error) {
        if (error instanceof GameFlowError) {
            res.status(409).json({ error: error.message });
            return;
        }
        next(error);
    }
});
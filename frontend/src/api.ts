// fetch() helpers for every /api route, used by all the screens.

export interface CombatResponse {
    combatId: string;
    questionId: number;
    question: string;
    playerHp: number;
    enemyHp: number;
}

export interface AnswerResponse {
    combatId: string;
    questionId: number;
    correct: boolean;
    correctAnswer: number;
    playerHp: number;
    enemyHp: number;
    result: "ongoing" | "win" | "lose";
}

export async function createRun() {
    const response = await fetch("/api/runs", {
        method: "POST",
    });

    if (!response.ok) {
        throw new Error("Could not start a new run");
    }

    return response.json();
}

export async function getRun(id: string) {
    const response = await fetch(`/api/runs/${id}`, {
        method: "GET",
    });

    if (!response.ok) {
        throw new Error("Could not get run data");
    }

    return response.json();
}

export async function getCombat(id: string):
Promise<CombatResponse> {
    const response = await fetch(`/api/runs/${id}/combat`, {
        method: "GET",
    });

    if (!response.ok) {
        throw new Error("Could not get combat data");
    }
    
    return response.json();
}

export async function submitAnswer(id: string, combatId: string, questionId: number, answer: number):
Promise<AnswerResponse> {
    const response = await fetch(`/api/runs/${id}/combat/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ combatId, questionId, answer }),
    });

    if (!response.ok) {
        throw new Error("Could not submit answer");
    }

    return response.json();
}

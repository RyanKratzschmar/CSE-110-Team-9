// @vitest-environment jsdom
import "vitest-canvas-mock";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Konva from "konva";
import { createEndGameButton } from "../src/EndGameButton";
import type { Screen } from "../src/types";

describe("Shared End Game button", () => {
    it("does not act while hidden and supports click and tap when visible", () => {
        const endGame = vi.fn();
        const button = createEndGameButton(endGame);
        button.fire("click");
        expect(endGame).not.toHaveBeenCalled();

        button.show();
        button.fire("click");
        button.fire("tap");
        expect(endGame).toHaveBeenCalledTimes(2);
    });
});

describe("End Game navigation across the real app", () => {
    let app: typeof import("../src/main")["app"];

    beforeAll(async () => {
        vi.useFakeTimers();
        vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
        vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
        document.body.innerHTML = '<div id="container"></div>';
        app = (await import("../src/main")).app;
    });

    beforeEach(() => {
        app.switchToScreen({ type: "menu" });
        app["gameSession"].newGame();
    });

    afterAll(() => {
        if (app) {
            app.switchToScreen({ type: "menu" });
            app["stage"].destroy();
        }
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    function button(): Konva.Group {
        return app["stage"].findOne<Konva.Group>(".end-game-button")!;
    }

    function reachRest(): void {
        const level = app["gameSession"].state.level;
        for (let fight = 0; fight < 3; fight++) level.completeCurrent();
    }

    it("keeps the button hidden and inactive on the title screen", () => {
        expect(button()).toBeDefined();
        expect(button().isVisible()).toBe(false);
        button().fire("click");
        expect(app["gameSession"].state.gameOver).toBe(false);
        expect(app["titleScreenController"].getView().getGroup().isVisible()).toBe(true);
    });

    it.each(["leaderboard", "gameover", "upgrade", "potion"] as const)(
        "keeps the button hidden and inactive on %s",
        type => {
            if (type === "upgrade" || type === "potion") reachRest();
            app.switchToScreen({ type });
            const showGameOver = vi.spyOn(app["gameOverScreenController"], "show");

            expect(button().isVisible()).toBe(false);
            button().fire("click");
            button().fire("tap");
            expect(showGameOver).not.toHaveBeenCalled();
            showGameOver.mockRestore();
        },
    );

    it.each(["game", "map", "rest"] as const)(
        "ends the run from %s and displays Game Over",
        type => {
            if (type === "rest") reachRest();
            app.switchToScreen({ type } as Screen);
            expect(button().isVisible()).toBe(true);
            expect(app["stage"].find(".end-game-button")).toHaveLength(1);

            button().fire("click");
            expect(app["endGameConfirmation"].getGroup().isVisible()).toBe(true);
            expect(app["gameSession"].state.gameOver).toBe(false);
            app["endGameConfirmation"].getGroup().findOne(".confirm-end-game")!.fire("click");

            expect(app["gameSession"].state.gameOver).toBe(true);
            expect(app["gameSession"].state.combat).toBeNull();
            expect(app["gameOverScreenController"].getView().getGroup().isVisible()).toBe(true);
            expect(app["combatMainScreenController"].getView().getGroup().isVisible()).toBe(false);
            expect(app["upgradeMinigameScreenController"].getView().getGroup().isVisible()).toBe(false);
        },
    );

    it.each(["game", "map", "rest"] as const)("cancels ending the run from %s without changing state", type => {
        if (type === "rest") reachRest();
        app.switchToScreen({ type });
        const state = app["gameSession"].state;
        const combat = state.combat;
        const hp = state.player.hp;
        const currentIndex = state.level.currentIndex;

        button().fire("tap");
        app["endGameConfirmation"].getGroup().findOne(".cancel-end-game")!.fire("tap");

        expect(app["endGameConfirmation"].getGroup().isVisible()).toBe(false);
        expect(state.gameOver).toBe(false);
        expect(state.combat).toBe(combat);
        expect(state.player.hp).toBe(hp);
        expect(state.level.currentIndex).toBe(currentIndex);
        expect(button().isVisible()).toBe(true);
    });

    it("blocks combat typing during confirmation and restores input after Cancel", () => {
        app.switchToScreen({ type: "game" });
        app["combatMainScreenController"].handleAttackClick();
        const view = app["combatMainScreenController"].getView();
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));
        const answer = view["answerBuffer"];
        expect(answer).toBe("1");

        button().fire("click");
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "2" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        expect(view["answerBuffer"]).toBe(answer);
        app["endGameConfirmation"].getGroup().findOne(".cancel-end-game")!.fire("click");
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "3" }));
        expect(view["answerBuffer"]).toBe("13");
    });

    it("shows End Game again after returning from a minigame to Rest", () => {
        reachRest();
        app.switchToScreen({ type: "upgrade" });
        expect(button().isVisible()).toBe(false);
        app.switchToScreen({ type: "rest" });
        expect(button().isVisible()).toBe(true);
        app.switchToScreen({ type: "potion" });
        expect(button().isVisible()).toBe(false);
        app.switchToScreen({ type: "rest" });
        expect(button().isVisible()).toBe(true);
    });

    it("stops the active upgrade timer when navigating to Game Over", () => {
        reachRest();
        app.switchToScreen({ type: "upgrade" });
        const upgradeView = app["upgradeMinigameScreenController"].getView();
        const startLabel = upgradeView.getGroup().find<Konva.Text>("Text")
            .find(node => node.text() === "Start")!;
        startLabel.getParent()!.fire("click");
        const game = app["gameSession"].state.upgradeMinigame!;
        const remainingTime = vi.spyOn(game, "getRemainingTime");
        vi.advanceTimersByTime(1000);
        expect(remainingTime).toHaveBeenCalled();

        app.switchToScreen({ type: "gameover" });
        remainingTime.mockClear();
        vi.advanceTimersByTime(60_000);

        expect(remainingTime).not.toHaveBeenCalled();
        expect(app["gameOverScreenController"].getView().getGroup().isVisible()).toBe(true);
        expect(app["gameSession"].state.upgradeClaimedLevel).toBeNull();
    });

    it("hides End Game again after Play Again returns to the title", () => {
        app.switchToScreen({ type: "map" });
        button().fire("tap");
        app["endGameConfirmation"].getGroup().findOne(".confirm-end-game")!.fire("tap");
        app["gameOverScreenController"].getView().getGroup().findOne(".play-again")!.fire("click");

        expect(button().isVisible()).toBe(false);
        expect(app["titleScreenController"].getView().getGroup().isVisible()).toBe(true);
    });
});

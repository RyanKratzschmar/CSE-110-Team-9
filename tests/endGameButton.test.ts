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

    it.each(["game", "map", "potion", "rest", "upgrade", "leaderboard", "gameover"] as const)(
        "ends the run from %s and displays Game Over",
        type => {
            if (["potion", "rest", "upgrade"].includes(type)) reachRest();
            app.switchToScreen({ type } as Screen);
            expect(button().isVisible()).toBe(true);
            expect(app["stage"].find(".end-game-button")).toHaveLength(1);

            button().fire("click");

            expect(app["gameSession"].state.gameOver).toBe(true);
            expect(app["gameSession"].state.combat).toBeNull();
            expect(app["gameOverScreenController"].getView().getGroup().isVisible()).toBe(true);
            expect(app["combatMainScreenController"].getView().getGroup().isVisible()).toBe(false);
            expect(app["upgradeMinigameScreenController"].getView().getGroup().isVisible()).toBe(false);
        },
    );

    it("stops the active upgrade timer when ending the run", () => {
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

        button().fire("tap");
        remainingTime.mockClear();
        vi.advanceTimersByTime(60_000);

        expect(remainingTime).not.toHaveBeenCalled();
        expect(app["gameOverScreenController"].getView().getGroup().isVisible()).toBe(true);
        expect(app["gameSession"].state.upgradeClaimedLevel).toBeNull();
    });

    it("hides End Game again after Play Again returns to the title", () => {
        app.switchToScreen({ type: "map" });
        button().fire("tap");
        app["gameOverScreenController"].getView().getGroup().findOne(".play-again")!.fire("click");

        expect(button().isVisible()).toBe(false);
        expect(app["titleScreenController"].getView().getGroup().isVisible()).toBe(true);
    });
});

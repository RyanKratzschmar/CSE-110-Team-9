// @vitest-environment jsdom
import "vitest-canvas-mock";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Konva from "konva";
import type { FloorEntry } from "../backend/game/Leaderboard/FloorLeaderboard";
import { LeaderboardScreenModel } from "../src/screens/LeaderboardScreen/LeaderboardScreenModel";
import { LeaderboardScreenView } from "../src/screens/LeaderboardScreen/LeaderboardScreenView";
import { LeaderBoardScreenController } from "../src/screens/LeaderboardScreen/LeaderboardScreenController";
import { FloorLeaderboard } from "../backend/game/Leaderboard/FloorLeaderboard";
import { GameSession } from "../src/GameSession";
import { GameOverScreenController } from "../src/screens/GameOverScreen/GameOverScreenController";
import { finishCombat, finishRest } from "../backend/game/GameManager";
import { FIGHTS_PER_LEVEL } from "../backend/game/Level";

const FLOORS: FloorEntry[] = [
    { gameNumber: 1, floor: 3 },
    { gameNumber: 2, floor: 2 },
    { gameNumber: 3, floor: 1 },
];


//Creates many entries so that we can test the scrollability of the sorted list (descending order)
function manyEntries(n: number): FloorEntry[] {
    return Array.from({ length: n }, (_, i) => ({ gameNumber: i + 1, floor: n - i }));
}

//Returns all the text drawn in the view so tests can check what is shown on screen
function textsIn(view: LeaderboardScreenView): string[] {
    return view.getGroup().find("Text").map((node) => (node as Konva.Text).text());
}

//Creates a game session whose leaderboard already has games that cleared these floors
function sessionWithFloors(...floors: number[]): GameSession {
    const session = new GameSession();
    floors.forEach((f) => session.leaderboard.recordGame(f));
    return session;
}

//Creates mock view handlers so we can check when the view calls them and with what values
function makeHandlers() {
    return { onScrollBy: vi.fn(), onScrollTo: vi.fn(), onLeave: vi.fn() };
}

const playMock = vi.fn(); //Fake play to test whether the click sound plays without real audio

//Runs before every test so each test starts fresh
beforeEach(() => {
    vi.clearAllMocks(); //Clears all mock calls from the previous test
    vi.stubGlobal("Audio", vi.fn(() => ({ currentTime: 0, play: playMock }))); //Replaces Audio with a fake so no real sound plays and we can check play() was called
});

describe("FloorLeaderboard", () => {
    it("starts empty", () => {
        expect(new FloorLeaderboard().getSorted()).toEqual([]);
    });

    it("numbers games in order and sorts by floor, tied games earliest first", () => {
        const board = new FloorLeaderboard();
        [2, 5, 2].forEach((f) => board.recordGame(f));
        expect(board.getSorted()).toEqual([
            { gameNumber: 2, floor: 5 },
            { gameNumber: 1, floor: 2 },
            { gameNumber: 3, floor: 2 },
        ]);
    });

    it("getSorted returns a copy, so changing it does not change the leaderboard", () => {
        const board = new FloorLeaderboard();
        board.recordGame(1);
        board.getSorted().pop();
        expect(board.getSorted()).toHaveLength(1);
    });
});

describe("Recording finished games", () => {
    const openGameOver = (session: GameSession) => new GameOverScreenController({ switchToScreen: vi.fn() }, session).show();

    it("records the highest floor cleared and keeps it after New Game", () => {
        const session = new GameSession();
        session.newGame();
        for (let i = 0; i < FIGHTS_PER_LEVEL; i++) session.state.level.completeCurrent(); // reach the rest stop
        finishRest(session.state);
        openGameOver(session);
        session.newGame();
        expect(session.leaderboard.getSorted()).toEqual([{ gameNumber: 1, floor: 1 }]);
    });

    it("counts a game once even if Game Over opens twice", () => {
        const session = new GameSession();
        session.newGame();
        openGameOver(session);
        openGameOver(session);
        expect(session.leaderboard.getSorted()).toEqual([{ gameNumber: 1, floor: 0 }]);
    });

    it("counts a game lost in combat", () => {
        const session = new GameSession();
        session.newGame();
        finishCombat(session.state, "lose"); // sets gameOver before the screen opens
        openGameOver(session);
        expect(session.leaderboard.getSorted()).toHaveLength(1);
    });

    it("does not count Game Over when no game was started", () => {
        const session = new GameSession();
        openGameOver(session);
        expect(session.leaderboard.getSorted()).toEqual([]);
    });
});

describe("LeaderboardScreenModel", () => {
    it("starts in the loading state with no entries", () => {
        const model = new LeaderboardScreenModel();
        expect(model.getState()).toEqual({ leaderboard: [], scrollY: 0, loading: true });
    });

    it("setEntries stores entries, stops loading, and resets scroll to the top", () => {
        const model = new LeaderboardScreenModel();
        model.scrollTo(100, 500);
        model.setEntries(FLOORS);
        expect(model.getState()).toEqual({ leaderboard: FLOORS, scrollY: 0, loading: false });
    });
    
    it("setLoading clears entries and goes back to loading", () => {
        const model = new LeaderboardScreenModel();
        model.setEntries(FLOORS);
        model.setLoading();
        expect(model.getState()).toEqual({ leaderboard: [], scrollY: 0, loading: true });
    });

    it("notifies subscribers on change and stops after unsubscribing", () => {
        const model = new LeaderboardScreenModel();
        const listener = vi.fn();
        const unsubscribe = model.subscribe(listener);
        model.setEntries(FLOORS);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(model.getState());
        unsubscribe();
        model.setLoading();
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("clamps scrolling between 0 and maxScroll", () => {
        const model = new LeaderboardScreenModel();
        model.scrollTo(999, 300);
        expect(model.getState().scrollY).toBe(300);
        model.scrollTo(-50, 300);
        expect(model.getState().scrollY).toBe(0);
        model.scrollBy(120, 300);
        model.scrollBy(120, 300);
        model.scrollBy(120, 300);
        expect(model.getState().scrollY).toBe(300);
    });

    it("never scrolls when maxScroll is negative (content shorter than viewport)", () => {
        const model = new LeaderboardScreenModel();
        model.scrollBy(100, -40);
        expect(model.getState().scrollY).toBe(0);
    });

    it("does not notify listeners when the scroll position does not change", () => {
        const model = new LeaderboardScreenModel();
        const listener = vi.fn();
        model.subscribe(listener);
        model.scrollTo(-10, 300);
        expect(listener).not.toHaveBeenCalled();
    });
});

describe("LeaderboardScreenView", () => {
    it("shows 'Loading...' while loading", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: [], scrollY: 0, loading: true });
        expect(textsIn(view)).toContain("Loading...");
    });

    it("shows 'No games yet' when loaded with no entries", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: [], scrollY: 0, loading: false });
        expect(textsIn(view)).toContain("No games yet");
        expect(textsIn(view)).not.toContain("Loading...");
    });

    it("draws a row per entry with rank and floor in the given order", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: FLOORS, scrollY: 0, loading: false });
        const texts = textsIn(view);
        expect(texts).toEqual(expect.arrayContaining(["1", "2", "3", "Game 1", "Game 2", "Game 3", "Floor 3", "Floor 2", "Floor 1"]));
        expect(texts.indexOf("Floor 3")).toBeLessThan(texts.indexOf("Floor 2"));
        expect(texts.indexOf("Floor 2")).toBeLessThan(texts.indexOf("Floor 1"));
        expect(texts).not.toContain("No games yet");
    });

    it("shows the column headers only when there are games", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: [], scrollY: 0, loading: false });
        expect(view["headerGroup"].visible()).toBe(false);
        view.render({ leaderboard: FLOORS, scrollY: 0, loading: false });
        expect(view["headerGroup"].visible()).toBe(true);
        view.render({ leaderboard: [], scrollY: 0, loading: true });
        expect(view["headerGroup"].visible()).toBe(false);
    });

    it("gives tied games consecutive ranks and different medal colors", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({
            leaderboard: [
                { gameNumber: 2, floor: 5 },
                { gameNumber: 1, floor: 2 },
                { gameNumber: 3, floor: 2 },
                { gameNumber: 4, floor: 0 },
            ],
            scrollY: 0,
            loading: false,
        });
        const rows = view["listGroup"].getChildren() as Konva.Group[];
        expect(rows.map((row) => row.findOne<Konva.Text>("Text")!.text())).toEqual(["1", "2", "3", "4"]);
        expect(rows[1].findOne<Konva.Rect>("Rect")!.fill()).not.toBe(rows[2].findOne<Konva.Rect>("Rect")!.fill());
    });

    it("has no scroll room for a short list and correct scroll room for a long one", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: FLOORS, scrollY: 0, loading: false });
        expect(view.getMaxScroll()).toBe(0);
        view.render({ leaderboard: manyEntries(20), scrollY: 0, loading: false });
        expect(view.getMaxScroll()).toBe(20 * 72 - 648);
    });

    it("mouse wheel calls onScrollBy (pixels, and lines converted to rows)", () => {
        const handlers = makeHandlers();
        const view = new LeaderboardScreenView(handlers);
        view.getGroup().fire("wheel", { evt: { deltaY: 100, deltaMode: 0, preventDefault: vi.fn() } });
        view.getGroup().fire("wheel", { evt: { deltaY: 2, deltaMode: 1, preventDefault: vi.fn() } });
        expect(handlers.onScrollBy).toHaveBeenNthCalledWith(1, 100);
        expect(handlers.onScrollBy).toHaveBeenNthCalledWith(2, 2 * 72);
    });

    it("clicking Leave calls onLeave", () => {
        const handlers = makeHandlers();
        const view = new LeaderboardScreenView(handlers);
        const leaveText = view.getGroup().find("Text").find((n) => (n as Konva.Text).text() === "Leave")!;
        leaveText.getParent()!.fire("click");
        expect(handlers.onLeave).toHaveBeenCalledTimes(1);
    });

    it("show/hide toggle visibility and hide resets the cursor", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        document.body.style.cursor = "pointer";
        view.show();
        expect(view.getGroup().visible()).toBe(true);
        view.hide();
        expect(view.getGroup().visible()).toBe(false);
        expect(document.body.style.cursor).toBe("default");
    });
});

describe("LeaderBoardScreenController", () => {
    const makeSwitcher = () => ({ switchToScreen: vi.fn() });
    it("startLeaderboard shows the screen and displays the session's floors, highest first", () => {
        const controller = new LeaderBoardScreenController(makeSwitcher(), sessionWithFloors(1, 2, 3));
        controller.startLeaderboard();
        expect(controller.getView().getGroup().visible()).toBe(true);
        expect(controller["model"].getState().leaderboard.map((e) => e.floor)).toEqual([3, 2, 1]);
        expect(textsIn(controller.getView())).toEqual(expect.arrayContaining(["Floor 3", "Floor 2", "Floor 1"]));
        controller.hide();
    });

    it("shows 'No games yet' before any game has been started", () => {
        const controller = new LeaderBoardScreenController(makeSwitcher(), new GameSession());
        controller.startLeaderboard();
        expect(textsIn(controller.getView())).toContain("No games yet");
        expect(controller["model"].getState().loading).toBe(false);
        controller.hide();
    });

    it("Leave plays the click sound and switches to the menu", () => {
        const switcher = makeSwitcher();
        const controller = new LeaderBoardScreenController(switcher, new GameSession());
        const leaveText = controller.getView().getGroup().find("Text").find((n) => (n as Konva.Text).text() === "Leave")!;
        leaveText.getParent()!.fire("click");
        expect(playMock).toHaveBeenCalledTimes(1);
        expect(switcher.switchToScreen).toHaveBeenCalledWith({ type: "menu" });
    });

    it("End/Home keys scroll to the bottom/top, and keys are ignored after hide", () => {
        const floors = Array.from({ length: 20 }, (_, i) => i + 1);
        const controller = new LeaderBoardScreenController(makeSwitcher(), sessionWithFloors(...floors));
        controller.startLeaderboard();
        const max = controller.getView().getMaxScroll();
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
        expect(controller["model"].getState().scrollY).toBe(max);
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
        expect(controller["model"].getState().scrollY).toBe(0);
        controller.hide();
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
        expect(controller["model"].getState().scrollY).toBe(0);
    });
});
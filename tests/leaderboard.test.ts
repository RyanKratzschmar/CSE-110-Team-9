// @vitest-environment jsdom
import "vitest-canvas-mock";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import Konva from "konva";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { getSortedLeaderboard, addScore } from "../backend/game/Leaderboard/Leaderboard";
import type { LeaderboardEntry } from "../backend/game/Leaderboard/Leaderboard";
import type { FloorEntry } from "../backend/game/Leaderboard/FloorLeaderboard";
import { app } from "../backend/app";
import { LeaderboardScreenModel } from "../src/screens/LeaderboardScreen/LeaderboardScreenModel";
import { LeaderboardScreenView } from "../src/screens/LeaderboardScreen/LeaderboardScreenView";
import { LeaderBoardScreenController } from "../src/screens/LeaderboardScreen/LeaderboardScreenController";
import { FloorLeaderboard } from "../backend/game/Leaderboard/FloorLeaderboard";
import { GameSession } from "../src/GameSession";
import { GameState } from "../backend/game/GameState";
import { finishRest } from "../backend/game/GameManager";
import { FIGHTS_PER_LEVEL } from "../backend/game/Level";

//Creates a mock file system so that the tests never change the real leaderboard.json
vi.mock("node:fs", () => {
    const fs = { existsSync: vi.fn(), readFileSync: vi.fn(), writeFileSync: vi.fn() };
    return { ...fs, default: fs };
});

const mockExists = vi.mocked(existsSync);
const mockRead = vi.mocked(readFileSync);
const mockWrite = vi.mocked(writeFileSync);

//Helper function that pretends leaderboard.json exists and contains these entries
function mockFile(entries: LeaderboardEntry[]): void {
    mockExists.mockReturnValue(true);
    mockRead.mockReturnValue(JSON.stringify(entries));
}

//Mock leaderboard entries
const ENTRIES: LeaderboardEntry[] = [
    { timestamp: "2026-11-01T00:00:00.000Z", score: 50 },
    { timestamp: "2026-11-02T00:00:00.000Z", score: 200 },
    { timestamp: "2026-11-03T00:00:00.000Z", score: 120 },
];

const FLOORS: FloorEntry[] = [
    { timestamp: "2026-11-03T00:00:00.000Z", floor: 3 },
    { timestamp: "2026-11-02T00:00:00.000Z", floor: 2 },
    { timestamp: "2026-11-01T00:00:00.000Z", floor: 1 },
];


//Creates many entries so that we can test the scrollability of the sorted list (descending order)
function manyEntries(n: number): FloorEntry[] {
    return Array.from({ length: n }, (_, i) => ({ timestamp: "2026-11-01T00:00:00.000Z", floor: n - i }));
}

//Returns all the text drawn in the view so tests can check what is shown on screen
function textsIn(view: LeaderboardScreenView): string[] {
    return view.getGroup().find("Text").map((node) => (node as Konva.Text).text());
}

//Creates a game session whose floor log already has these floors
function sessionWithFloors(...floors: number[]): GameSession {
    const session = new GameSession();
    floors.forEach((f) => session.state.floorLog.recordFloor(f));
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


describe("Leaderboard backend", () => {
    it("returns entries sorted by score, highest first", () => {
        mockFile(ENTRIES);
        const result = getSortedLeaderboard();
        expect(result.map((e) => e.score)).toEqual([200, 120, 50]);
        expect(result[0].timestamp).toBe("2026-11-02T00:00:00.000Z");
    });

    it("returns an empty list when the leaderboard file does not exist", () => {
        mockExists.mockReturnValue(false);
        expect(getSortedLeaderboard()).toEqual([]);
        expect(mockRead).not.toHaveBeenCalled();
    });

    it("addScore appends the new entry and saves all entries", () => {
        mockFile([ENTRIES[0]]);
        const newEntry = { timestamp: "2026-11-04T00:00:00.000Z", score: 75 };
        addScore(newEntry);
        expect(mockWrite).toHaveBeenCalledTimes(1);
        const saved = JSON.parse(mockWrite.mock.calls[0][1] as string);
        expect(saved).toEqual([ENTRIES[0], newEntry]);
    });

    it("addScore creates the file when none exists yet", () => {
        mockExists.mockReturnValue(false);
        const newEntry = { timestamp: "2026-11-04T00:00:00.000Z", score: 10 };
        addScore(newEntry);
        const saved = JSON.parse(mockWrite.mock.calls[0][1] as string);
        expect(saved).toEqual([newEntry]);
    });

    it("throws when the leaderboard file is corrupted", () => {
        mockExists.mockReturnValue(true);
        mockRead.mockReturnValue("{ not valid json");
        expect(() => getSortedLeaderboard()).toThrow();
    });
});

describe("GET /api/leaderboard", () => {
    it("responds 200 with the sorted leaderboard", async () => {
        mockFile(ENTRIES);
        const res = await request(app).get("/api/leaderboard");
        expect(res.status).toBe(200);
        expect(res.body.map((e: LeaderboardEntry) => e.score)).toEqual([200, 120, 50]);
    });

    it("responds 200 with an empty array when there are no scores", async () => {
        mockExists.mockReturnValue(false);
        const res = await request(app).get("/api/leaderboard");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("responds 500 when the leaderboard file is corrupted", async () => {
        mockExists.mockReturnValue(true);
        mockRead.mockReturnValue("garbage");
        const res = await request(app).get("/api/leaderboard");
        expect(res.status).toBe(500);
    });
});

describe("POST /api/leaderboard", () => {
    it("saves a valid score with a timestamp and responds 200", async () => {
        mockExists.mockReturnValue(false);
        const res = await request(app).post("/api/leaderboard").send({ score: 150 });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Saved" });
        const saved = JSON.parse(mockWrite.mock.calls[0][1] as string);
        expect(saved).toHaveLength(1);
        expect(saved[0].score).toBe(150);
        expect(Number.isNaN(Date.parse(saved[0].timestamp))).toBe(false);
    });

    it("responds 400 and saves nothing when score is missing", async () => {
        const res = await request(app).post("/api/leaderboard").send({});
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "score (number) required" });
        expect(mockWrite).not.toHaveBeenCalled();
    });

    it("responds 400 and saves nothing when score is not a number", async () => {
        const res = await request(app).post("/api/leaderboard").send({ score: "100" });
        expect(res.status).toBe(400);
        expect(mockWrite).not.toHaveBeenCalled();
    });
});

describe("FloorLeaderboard", () => {
    it("starts empty", () => {
        expect(new FloorLeaderboard().getSorted()).toEqual([]);
    });

    it("returns floors highest first with valid timestamps", () => {
        const log = new FloorLeaderboard();
        log.recordFloor(1);
        log.recordFloor(2);
        log.recordFloor(3);
        const result = log.getSorted();
        expect(result.map((e) => e.floor)).toEqual([3, 2, 1]);
        result.forEach((e) => expect(Number.isNaN(Date.parse(e.timestamp))).toBe(false));
    });

    it("records the same floor only once", () => {
        const log = new FloorLeaderboard();
        log.recordFloor(2);
        log.recordFloor(2);
        expect(log.getSorted()).toHaveLength(1);
    });

    it("getSorted returns a copy, so changing it does not change the log", () => {
        const log = new FloorLeaderboard();
        log.recordFloor(1);
        log.getSorted().pop();
        expect(log.getSorted()).toHaveLength(1);
    });
});

describe("Floor recording during a run", () => {
    it("newGame clears the previous run and records Floor 1", () => {
        const session = sessionWithFloors(1, 2, 3);
        session.newGame();
        expect(session.state.floorLog.getSorted().map((e) => e.floor)).toEqual([1]);
    });

    it("finishRest records the next floor", () => {
        const state = new GameState();
        state.floorLog.recordFloor(1);
        for (let i = 0; i < FIGHTS_PER_LEVEL; i++) state.level.completeCurrent(); // reach the rest stop
        finishRest(state);
        expect(state.floorLog.getSorted().map((e) => e.floor)).toEqual([2, 1]);
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

    it("shows 'No floors yet' when loaded with no entries", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: [], scrollY: 0, loading: false });
        expect(textsIn(view)).toContain("No floors yet");
        expect(textsIn(view)).not.toContain("Loading...");
    });

    it("draws a row per entry with rank and floor in the given order", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: FLOORS, scrollY: 0, loading: false });
        const texts = textsIn(view);
        expect(texts).toEqual(expect.arrayContaining(["1", "2", "3", "Floor 3", "Floor 2", "Floor 1"]));
        expect(texts.indexOf("Floor 3")).toBeLessThan(texts.indexOf("Floor 2"));
        expect(texts.indexOf("Floor 2")).toBeLessThan(texts.indexOf("Floor 1"));
        expect(texts).not.toContain("No floors yet");
    });

    it("shows an invalid timestamp as-is instead of crashing", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: [{ timestamp: "not-a-date", floor: 5 }], scrollY: 0, loading: false });
        expect(textsIn(view)).toContain("not-a-date");
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

    it("shows 'No floors yet' before any game has been started", () => {
        const controller = new LeaderBoardScreenController(makeSwitcher(), new GameSession());
        controller.startLeaderboard();
        expect(textsIn(controller.getView())).toContain("No floors yet");
        expect(controller["model"].getState().loading).toBe(false);
        controller.hide();
    });

    it("shows the new run's floors after New Game", () => {
        const session = sessionWithFloors(1, 2, 3);
        const controller = new LeaderBoardScreenController(makeSwitcher(), session);
        session.newGame();
        controller.startLeaderboard();
        expect(controller["model"].getState().leaderboard.map((e) => e.floor)).toEqual([1]);
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
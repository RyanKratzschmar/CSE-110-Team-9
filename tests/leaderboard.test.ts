// @vitest-environment jsdom
import "vitest-canvas-mock";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import Konva from "konva";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { getSortedLeaderboard, addScore } from "../backend/game/Leaderboard/Leaderboard";
import type { LeaderboardEntry } from "../backend/game/Leaderboard/Leaderboard";
import { app } from "../backend/app";
import { LeaderboardScreenModel } from "../src/screens/LeaderboardScreen/LeaderboardScreenModel";
import { LeaderboardScreenView } from "../src/screens/LeaderboardScreen/LeaderboardScreenView";
import { LeaderBoardScreenController } from "../src/screens/LeaderboardScreen/LeaderboardScreenController";

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

//Creates many entries so that we can test the scrollability of the sorted list (descending order)
function manyEntries(n: number): LeaderboardEntry[] {
    return Array.from({ length: n }, (_, i) => ({ timestamp: "2026-11-01T00:00:00.000Z", score: 1000 - i }));
}

//Returns all the text drawn in the view so tests can check what is shown on screen
function textsIn(view: LeaderboardScreenView): string[] {
    return view.getGroup().find("Text").map((node) => (node as Konva.Text).text());
}

//Creates a fake successful fetch response that returns the mock entries
function okResponse(entries: LeaderboardEntry[]) {
    return { ok: true, status: 200, json: async () => entries };
}

//Creates mock view handlers so we can check when the view calls them and with what values
function makeHandlers() {
    return { onScrollBy: vi.fn(), onScrollTo: vi.fn(), onLeave: vi.fn() };
}

const fetchMock = vi.fn(); //Fake fetch created for testing so that a real network request isn't made
const playMock = vi.fn(); //Fake play to test whether the click sound plays without real audio

//Runs before every test so each test starts fresh
beforeEach(() => {
    vi.clearAllMocks(); //Clears all mock calls from the previous test
    vi.stubGlobal("fetch", fetchMock); //Ensures controller's fetch calls are mock ones rather than real ones
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

describe("LeaderboardScreenModel", () => {
    it("starts in the loading state with no entries", () => {
        const model = new LeaderboardScreenModel();
        expect(model.getState()).toEqual({ leaderboard: [], scrollY: 0, loading: true });
    });

    it("setEntries stores entries, stops loading, and resets scroll to the top", () => {
        const model = new LeaderboardScreenModel();
        model.scrollTo(100, 500);
        model.setEntries(ENTRIES);
        expect(model.getState()).toEqual({ leaderboard: ENTRIES, scrollY: 0, loading: false });
    });
    
    it("setLoading clears entries and goes back to loading", () => {
        const model = new LeaderboardScreenModel();
        model.setEntries(ENTRIES);
        model.setLoading();
        expect(model.getState()).toEqual({ leaderboard: [], scrollY: 0, loading: true });
    });

    it("notifies subscribers on change and stops after unsubscribing", () => {
        const model = new LeaderboardScreenModel();
        const listener = vi.fn();
        const unsubscribe = model.subscribe(listener);
        model.setEntries(ENTRIES);
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

    it("shows 'No scores yet' when loaded with no entries", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: [], scrollY: 0, loading: false });
        expect(textsIn(view)).toContain("No scores yet");
        expect(textsIn(view)).not.toContain("Loading...");
    });

    it("draws a row per entry with rank and score in the given order", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        const sorted = [...ENTRIES].sort((a, b) => b.score - a.score);
        view.render({ leaderboard: sorted, scrollY: 0, loading: false });
        const texts = textsIn(view);
        expect(texts).toEqual(expect.arrayContaining(["1", "2", "3", "200", "120", "50"]));
        expect(texts.indexOf("200")).toBeLessThan(texts.indexOf("120"));
        expect(texts.indexOf("120")).toBeLessThan(texts.indexOf("50"));
        expect(texts).not.toContain("No scores yet");
    });

    it("shows an invalid timestamp as-is instead of crashing", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: [{ timestamp: "not-a-date", score: 5 }], scrollY: 0, loading: false });
        expect(textsIn(view)).toContain("not-a-date");
    });

    it("has no scroll room for a short list and correct scroll room for a long one", () => {
        const view = new LeaderboardScreenView(makeHandlers());
        view.render({ leaderboard: ENTRIES, scrollY: 0, loading: false });
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
    const makeSwitcher = () => ({
        switchToScreen: vi.fn(),
        startNewGame: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    });
    it("startLeaderboard shows the screen and displays fetched entries", async () => {
        fetchMock.mockResolvedValue(okResponse(ENTRIES));
        const controller = new LeaderBoardScreenController(makeSwitcher());
        await controller.startLeaderboard();
        expect(fetchMock).toHaveBeenCalledWith("/api/leaderboard");
        expect(controller.getView().getGroup().visible()).toBe(true);
        expect(textsIn(controller.getView())).toEqual(expect.arrayContaining(["200", "120", "50"]));
        controller.hide();
    });

    it("shows 'No scores yet' when the server responds with an error status", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
        const controller = new LeaderBoardScreenController(makeSwitcher());
        await controller.startLeaderboard();
        expect(textsIn(controller.getView())).toContain("No scores yet");
        expect(errorSpy).toHaveBeenCalled();
        controller.hide();
    });

    it("shows 'No scores yet' when the network request fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        fetchMock.mockRejectedValue(new Error("network down"));
        const controller = new LeaderBoardScreenController(makeSwitcher());
        await controller.startLeaderboard();
        expect(textsIn(controller.getView())).toContain("No scores yet");
        expect(controller["model"].getState().loading).toBe(false);
        controller.hide();
    });

    it("ignores a slow older request that finishes after a newer one", async () => {
        let resolveFirst!: (value: unknown) => void;
        fetchMock.mockReturnValueOnce(new Promise((r) => { resolveFirst = r; })).mockResolvedValueOnce(okResponse([ENTRIES[1]]));
        const controller = new LeaderBoardScreenController(makeSwitcher());
        const first = controller.startLeaderboard();
        await controller.startLeaderboard();
        resolveFirst(okResponse(ENTRIES));
        await first;
        expect(controller["model"].getState().leaderboard).toEqual([ENTRIES[1]]);
        controller.hide();
    });

    it("Leave plays the click sound and switches to the menu", () => {
        const switcher = makeSwitcher();
        const controller = new LeaderBoardScreenController(switcher);
        const leaveText = controller.getView().getGroup().find("Text").find((n) => (n as Konva.Text).text() === "Leave")!;
        leaveText.getParent()!.fire("click");
        expect(playMock).toHaveBeenCalledTimes(1);
        expect(switcher.switchToScreen).toHaveBeenCalledWith({ type: "menu" });
    });

    it("End/Home keys scroll to the bottom/top, and keys are ignored after hide", async () => {
        fetchMock.mockResolvedValue(okResponse(manyEntries(20)));
        const controller = new LeaderBoardScreenController(makeSwitcher());
        await controller.startLeaderboard();
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

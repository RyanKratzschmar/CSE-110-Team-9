import { afterEach, describe, expect, it, vi } from "vitest";
import { createRun } from "../frontend/src/api";

afterEach(() => vi.unstubAllGlobals());

describe("createRun", () => {
    it("posts to the run endpoint and returns its response", async () => {
        const run = { id: "new-run" };
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => run });
        vi.stubGlobal("fetch", fetchMock);
        expect(await createRun()).toEqual(run);
        expect(fetchMock).toHaveBeenCalledWith("/api/runs", { method: "POST" });
    });

    it("rejects an unsuccessful response", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
        await expect(createRun()).rejects.toThrow("Could not start a new run");
    });

    it("propagates network failures to the caller", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
        await expect(createRun()).rejects.toThrow("offline");
    });
});

// @vitest-environment jsdom
import "vitest-canvas-mock";
import { describe, it, expect } from "vitest";
import Konva from "konva";
import {
    createHealthPercentage,
    updatePlayerHealthBar
} from "../src/PlayerHealthBar.ts";

describe("HP Percentage", () => {

    // Create a health bar for testing.
    function createBar(width = 400) {
        const bar = new Konva.Rect({
            x: 100,
            y: 35,
            width: width,
            height: 70,
        });

        const label = createHealthPercentage(bar, width);

        return { bar, label };
    }

    it("displays 100% when HP is full", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, 100, 100);

        expect(label.text()).toBe("100%");
        expect(bar.width()).toBe(400);
    });

    it("updates the percentage when the player takes damage", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, 75, 100);

        expect(label.text()).toBe("75%");
        expect(bar.width()).toBe(300);
    });

    it("updates the percentage after healing", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, 50, 100);
        updatePlayerHealthBar(bar, label, 80, 100);

        expect(label.text()).toBe("80%");
        expect(bar.width()).toBe(320);
    });

    it("updates the monster's HP percentage", () => {
        const { bar, label } = createBar(350);

        updatePlayerHealthBar(bar, label, 40, 100);

        expect(label.text()).toBe("40%");
        expect(bar.width()).toBe(140);
    });

    it("supports different maximum HP values", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, 150, 200);

        expect(label.text()).toBe("75%");
    });

    it("rounds the percentage to a whole number", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, 1, 3);

        expect(label.text()).toBe("33%");
    });

    it("displays 0% when HP reaches zero", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, 0, 100);

        expect(label.text()).toBe("0%");
        expect(bar.width()).toBe(0);
    });

    it("does not display negative percentages", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, -10, 100);

        expect(label.text()).toBe("0%");
        expect(bar.width()).toBe(0);
    });

    it("does not display percentages above 100%", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, 120, 100);

        expect(label.text()).toBe("100%");
        expect(bar.width()).toBe(400);
    });

    it("handles an invalid maximum HP", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, 10, 0);

        expect(label.text()).toBe("0%");
        expect(bar.width()).toBe(0);
    });

    it("keeps the percentage label centered", () => {
        const { bar, label } = createBar();

        updatePlayerHealthBar(bar, label, 20, 100);

        expect(label.x()).toBe(100);
        expect(label.y()).toBe(35);
        expect(label.width()).toBe(400);
        expect(label.height()).toBe(70);
        expect(label.align()).toBe("center");
        expect(label.verticalAlign()).toBe("middle");
    });

    it("does not block mouse interactions", () => {
        const { label } = createBar();

        expect(label.listening()).toBe(false);
    });
});
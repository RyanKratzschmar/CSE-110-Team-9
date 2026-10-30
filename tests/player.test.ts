// Tests Health and Player: starting HP, taking damage never below 0, and healing to full. (Sally)

import { describe, expect, it } from "vitest";
import { Health } from "../backend/game/Health";

//Health Test
describe("Health", () => {
  it("starts at max HP", () => {
    const health = new Health(100);
    expect(health.value).toBe(100);
    expect(health.max).toBe(100);
  });

  it("goes down when damaged", () => {
    const health = new Health(100);
    health.updateHealth(-30);
    expect(health.value).toBe(70);
  });

  it("never drops below 0", () => {
    const health = new Health(100);
    health.updateHealth(-500);
    expect(health.value).toBe(0);
    expect(health.isZero()).toBe(true);
  });

  it("never heals above max", () => {
    const health = new Health(100);
    health.updateHealth(-20);
    health.updateHealth(50);
    expect(health.value).toBe(100);
  });

  it("healFull restores max HP", () => {
    const health = new Health(100);
    health.updateHealth(-80);
    health.healFull();
    expect(health.value).toBe(100);
  });

  it("isZero is false while HP is above 0", () => {
    const health = new Health(100);
    health.updateHealth(-99);
    expect(health.isZero()).toBe(false);
  });

  it("rejects a max that isn't a positive whole number", () => {
    expect(() => new Health(0)).toThrow();
    expect(() => new Health(-10)).toThrow();
    expect(() => new Health(12.5)).toThrow();
  });
});

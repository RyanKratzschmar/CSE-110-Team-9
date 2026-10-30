// Tests Health and Player: starting HP, taking damage never below 0, and healing to full. (Sally)

import { describe, expect, it } from "vitest";
import { Health } from "../backend/game/Health";
import { Player } from "../backend/game/Player";

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



//player tests
describe("Player", () => {
  it("starts at full HP with default stats", () => {
    const player = new Player();
    expect(player.hp).toBe(100);
    expect(player.maxHp).toBe(100);
    expect(player.attack).toBe(10);
    expect(player.isDead()).toBe(false);
  });

  it("can start with custom stats", () => {
    const player = new Player(150, 15);
    expect(player.maxHp).toBe(150);
    expect(player.attack).toBe(15);
  });

  it("loses HP when taking damage", () => {
    const player = new Player(100);
    player.takeDamage(30);
    expect(player.hp).toBe(70);
  });

  it("never drops below 0 HP and is dead at 0", () => {
    const player = new Player(100);
    player.takeDamage(250);
    expect(player.hp).toBe(0);
    expect(player.isDead()).toBe(true);
  });

  it("rejects negative damage and invalid attack", () => {
    expect(() => new Player().takeDamage(-5)).toThrow();
    expect(() => new Player(100, -1)).toThrow();
    expect(() => new Player(100, 2.5)).toThrow();
  });

  it("heals back to max HP", () => {
    const player = new Player(100);
    player.takeDamage(60);
    player.healFull();
    expect(player.hp).toBe(100);
  });
});
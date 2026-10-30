// Health: current and max HP with updateHealth(); never drops below 0. Used by Player and Monster.

export class Health {
  private readonly maxHealth: number;
  private current: number;

  constructor(maxHealth: number) {
    if (!Number.isInteger(maxHealth) || maxHealth <= 0) {
      throw new Error("Max health must be a positive whole number");
    }
    this.maxHealth = maxHealth;
    this.current = maxHealth;
  }

  get max(): number {
    return this.maxHealth;
  }

  get value(): number {
    return this.current;
  }

  // Health always stays between 0 and max
  updateHealth(change: number): void {
    this.current = Math.min(this.maxHealth, Math.max(0, this.current + change));
  }

  healFull(): void {
    this.current = this.maxHealth;
  }

  isZero(): boolean {
    return this.current === 0;
  }
}
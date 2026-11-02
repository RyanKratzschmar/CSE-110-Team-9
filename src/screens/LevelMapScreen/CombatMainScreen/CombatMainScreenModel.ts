/*
/CombatMainScreenModel - Manages game state
*/
export class CombatMainScreenModel {
    private score = 0;
    private playerMaxHealth = 0;
    private enemyMaxHealth = 50;
    private playerCurrentHealth = 0;
    private enemyCurrentHealth = 50;

    // reset game score
    resetScore(): void{
        this.score = 0;
    }

    // Gets current player health
    getPlayerHealth(): number {
        return this.playerCurrentHealth;
    }

    // Gets max player health
    getPlayerMaxHealth(): number {
        return this.playerMaxHealth;
    }

    // Gets current enemy health
    getEnemyHealth(): number {
        return this.enemyCurrentHealth;
    }

    // Gets max enemy health
    getEnemyMaxHealth(): number {
        return this.enemyMaxHealth;
    }

    // Increase player's score by certain amount
    increaseScore(amount: number): void {
        this.score += amount;
    }

    // Set player's maximum health
    setPlayerMaxHealth(amount: number): void {
        this.playerMaxHealth = amount;
    }

    // Set enemy's maximum health
    setEnemyMaxHealth(amount: number): void {
        this.enemyMaxHealth = amount;
    }

    // Set player's current health
    setPlayerHealth(amount: number): void {
        this.playerCurrentHealth += amount;
    }

    // Set enemy's current health
    setEnemyCurrentHealth(amount: number): void {
        this.enemyCurrentHealth = amount;
    }

    // Reset enemy to a particular health
    resetEnemy(): void {
        this.enemyCurrentHealth = 50;
        this.enemyMaxHealth = 50;
    }

}
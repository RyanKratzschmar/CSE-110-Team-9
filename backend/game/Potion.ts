// Potion: a healing potion from the potion lab; a hard equation brews a better potion than an easy one. (Sally)

export type PotionType = "healing" | "strength" | "poison";
export type RecipeLevel = "basic" | "advanced"; // basic = easier equation, advanced = harder

export type Potion = { type: PotionType; level: RecipeLevel };

// What each potion does. 
export const HEAL_PERCENT: Record<RecipeLevel, number> = { basic: 20, advanced: 30 }; // % of max HP
export const STRENGTH_ROUNDS: Record<RecipeLevel, number> = { basic: 1, advanced: 2 }; // damage boost lasts this many rounds
export const POISON_ROUNDS: Record<RecipeLevel, number> = { basic: 1, advanced: 2 }; // enemy is poisoned this many rounds
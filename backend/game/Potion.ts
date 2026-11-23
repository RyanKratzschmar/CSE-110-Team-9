// Potion: what the potion lab brews and combat uses: healing, strength, or poison; a hard equation brews a better potion than an easy one. (Sally)

export type PotionType = "healing" | "strength" | "poison";
export type RecipeLevel = "basic" | "advanced"; // basic = easier equation, advanced = harder

export type Potion = { type: PotionType; level: RecipeLevel };

// What each potion does. A "round" is one answered combat question.
export const HEAL_PERCENT: Record<RecipeLevel, number> = { basic: 20, advanced: 30 }; // % of max HP
export const STRENGTH_ROUNDS: Record<RecipeLevel, number> = { basic: 1, advanced: 2 }; // damage boost lasts this many rounds
export const POISON_ROUNDS: Record<RecipeLevel, number> = { basic: 1, advanced: 2 }; // enemy is poisoned this many rounds
export const STRENGTH_DAMAGE_MULTIPLIER = 2; // a correct answer while strengthened does double damage
export const POISON_DAMAGE_PERCENT = 10; // poison takes this % of the enemy's max HP each round

const TYPE_NAMES: Record<PotionType, string> = { healing: "Healing", strength: "Strength", poison: "Poison" };
const LEVEL_NAMES: Record<RecipeLevel, string> = { basic: "Basic", advanced: "Advanced" };

// e.g. "Advanced Strength Potion"
export function potionName(potion: Potion): string {
  return `${LEVEL_NAMES[potion.level]} ${TYPE_NAMES[potion.type]} Potion`;
}

// What the potion does in combat; healingBonus is the upgrade minigame's extra healing in % points
export function describePotion(potion: Potion, healingBonus = 0): string {
  if (potion.type === "healing") return `Heals ${HEAL_PERCENT[potion.level] + healingBonus}% max HP`;
  const rounds = potion.type === "strength" ? STRENGTH_ROUNDS[potion.level] : POISON_ROUNDS[potion.level];
  const forRounds = `for ${rounds} round${rounds === 1 ? "" : "s"}`;
  if (potion.type === "strength") return `Doubles your attack damage ${forRounds}`;
  return `Poisons the enemy for ${POISON_DAMAGE_PERCENT}% of its max HP each round ${forRounds}`;
}

// One entry per kind of potion, in the order first brewed, with how many there are and where the first one is
export function groupPotions(potions: readonly Potion[]): { potion: Potion; count: number; firstIndex: number }[] {
  const groups: { potion: Potion; count: number; firstIndex: number }[] = [];
  potions.forEach((potion, index) => {
    const group = groups.find((g) => g.potion.type === potion.type && g.potion.level === potion.level);
    if (group) group.count += 1;
    else groups.push({ potion, count: 1, firstIndex: index });
  });
  return groups;
}

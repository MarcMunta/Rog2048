import type { Rarity, Weighted } from '../types/common';

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Común',
  uncommon: 'Inusual',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
  mythic: 'Mítico'
};

const NORMAL_REWARD_WEIGHTS: Weighted<Rarity>[] = [
  { item: 'common', weight: 46 },
  { item: 'uncommon', weight: 28 },
  { item: 'rare', weight: 16 },
  { item: 'epic', weight: 7 },
  { item: 'legendary', weight: 2.5 },
  { item: 'mythic', weight: 0.5 }
];

const ELITE_REWARD_WEIGHTS: Weighted<Rarity>[] = [
  { item: 'uncommon', weight: 34 },
  { item: 'rare', weight: 34 },
  { item: 'epic', weight: 22 },
  { item: 'legendary', weight: 8 },
  { item: 'mythic', weight: 2 }
];

const RELIC_PRICES: Record<Rarity, number> = {
  common: 28,
  uncommon: 36,
  rare: 46,
  epic: 58,
  legendary: 72,
  mythic: 92
};

const SKILL_PRICES: Record<Rarity, number> = {
  common: 24,
  uncommon: 32,
  rare: 40,
  epic: 52,
  legendary: 66,
  mythic: 84
};

export function rarityLabel(rarity: Rarity): string {
  return RARITY_LABELS[rarity];
}

export function rewardRarityWeights(elite = false): Weighted<Rarity>[] {
  return elite ? ELITE_REWARD_WEIGHTS : NORMAL_REWARD_WEIGHTS;
}

export function itemPrice(rarity: Rarity, type: 'relic' | 'skill'): number {
  return type === 'relic' ? RELIC_PRICES[rarity] : SKILL_PRICES[rarity];
}

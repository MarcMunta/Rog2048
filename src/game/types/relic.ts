import type { Rarity } from './common';

export type RelicEffectType =
  | 'lowMergeEnergy'
  | 'exactDouble'
  | 'overkillShield'
  | 'echoFirstMerge'
  | 'cursedFours'
  | 'bossTargetDown'
  | 'extraShopItem'
  | 'comboSkillDiscount'
  | 'healOn128'
  | 'goldOnTarget'
  | 'softNoMoves'
  | 'exactDuplicate'
  | 'bloodEdge'
  | 'unlockShield'
  | 'turnRerollEnergy'
  | 'exactCombo'
  | 'forgeBoost'
  | 'delayOnBigMerge'
  | 'lowHpDamage'
  | 'betterPreview'
  | 'thirdEightCreates16'
  | 'firstSpawnUpgraded'
  | 'comboBurn';

export interface RelicDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  effect: RelicEffectType;
  value?: number;
}

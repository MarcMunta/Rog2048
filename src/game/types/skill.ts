import type { Rarity } from './common';

export type SkillTargetMode = 'none' | 'tile';

export type SkillEffectType =
  | 'compress'
  | 'forge'
  | 'purge'
  | 'duplicate'
  | 'freeze'
  | 'rerollTarget'
  | 'bloodMerge'
  | 'oraclePreview';

export interface SkillDefinition {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
  cost: number;
  cooldown: number;
  targetMode: SkillTargetMode;
  effect: SkillEffectType;
}

export interface SkillState {
  id: string;
  cooldownLeft: number;
}

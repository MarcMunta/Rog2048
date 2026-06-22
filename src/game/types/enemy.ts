export type EnemyRank = 'normal' | 'elite' | 'boss';

export type EnemyBehaviorType =
  | 'basic'
  | 'exactOnly'
  | 'drainOnDelay'
  | 'mirrorTarget'
  | 'lockTile'
  | 'curseValue'
  | 'armor'
  | 'poorSpawns'
  | 'comboTax'
  | 'bossEntropy';

export interface EnemyBehavior {
  type: EnemyBehaviorType;
  amount?: number;
  every?: number;
  value?: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  rank: EnemyRank;
  act: number;
  maxHp: number;
  attackDamage: number;
  attackEvery: number;
  targets: number[];
  intent: string;
  ruleText: string;
  behaviors: EnemyBehavior[];
  palette: {
    primary: number;
    secondary: number;
    accent: number;
  };
}

export interface EnemyInstance extends EnemyDefinition {
  hp: number;
  currentTarget: number;
  targetIndex: number;
  attackTimer: number;
  specialCounter: number;
  armorStacks: number;
}

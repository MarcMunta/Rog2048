import type { Rarity } from './common';

export type NodeType = 'combat' | 'elite' | 'shop' | 'event' | 'rest' | 'boss';

export interface PlayerClassDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  maxHp: number;
  maxEnergy: number;
  startGold: number;
  startingRelics: string[];
  startingSkills: string[];
  palette: string;
}

export interface MapNodeState {
  id: string;
  act: number;
  depth: number;
  lane: number;
  type: NodeType;
  nextIds: string[];
  cleared: boolean;
}

export interface RunMapState {
  act: number;
  nodes: MapNodeState[];
  availableNodeIds: string[];
  completedNodeIds: string[];
}

export interface PlayerRunState {
  classId: string;
  hp: number;
  maxHp: number;
  maxEnergy: number;
  gold: number;
  shield: number;
}

export interface RewardChoice {
  id: string;
  type: 'relic' | 'skill' | 'gold' | 'heal' | 'maxHp';
  title: string;
  description: string;
  rarity: Rarity;
  refId?: string;
  amount?: number;
}

export interface PendingReward {
  source: NodeType;
  choices: RewardChoice[];
}

export interface RunState {
  id: string;
  seed: number;
  act: number;
  floor: number;
  player: PlayerRunState;
  relicIds: string[];
  skillIds: string[];
  skillUpgrades: Record<string, number>;
  map: RunMapState;
  currentNodeId: string | null;
  pendingReward: PendingReward | null;
  flags: Record<string, number>;
  stats: {
    turns: number;
    damage: number;
    combats: number;
    elites: number;
    bosses: number;
    highestTile: number;
  };
}

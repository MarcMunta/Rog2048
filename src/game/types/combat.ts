import type { BoardMoveResult, BoardState, Direction, Position } from './board';
import type { EnemyInstance, EnemyRank } from './enemy';
import type { SkillState } from './skill';

export type CombatStatus = 'active' | 'won' | 'lost';

export interface DamagePacket {
  amount: number;
  mergeValue: number;
  targetHit: boolean;
  exact: boolean;
  cursed: boolean;
  source: 'merge' | 'skill' | 'relic';
}

export interface FloatingTextEvent {
  text: string;
  x: number;
  y: number;
  tone: 'damage' | 'heal' | 'energy' | 'gold' | 'danger' | 'combo' | 'blocked' | 'status';
  anchor?: 'board' | 'enemy' | 'player';
}

export interface CombatActionResult {
  ok: boolean;
  reason?: string;
  usedSkillId?: string;
  move?: BoardMoveResult;
  damage: number;
  healed: number;
  shieldGained: number;
  energyGained: number;
  goldGained: number;
  targetHits: number;
  exactHits: number;
  combo: number;
  enemyAttacked: boolean;
  playerDamaged: number;
  bigHit: boolean;
  bossPhaseChanged?: number;
  logs: string[];
  floating: FloatingTextEvent[];
}

export interface CombatPlayerState {
  hp: number;
  maxHp: number;
  shield: number;
  energy: number;
  maxEnergy: number;
  gold: number;
}

export interface CombatStatusEffects {
  enemyBurn: number;
  empowered: number;
  drained: number;
}

export interface CombatState {
  id: string;
  status: CombatStatus;
  rank: EnemyRank;
  board: BoardState;
  enemy: EnemyInstance;
  player: CombatPlayerState;
  turn: number;
  combo: number;
  firstMergeEchoed: boolean;
  exactDuplicated: boolean;
  delayedDamageBonus: number;
  eightMergeCounter: number;
  bossPhase: number;
  bossPhaseTriggered: number[];
  statusEffects: CombatStatusEffects;
  skillStates: SkillState[];
  recentLogs: string[];
  lastDirection: Direction | null;
  selectionHint: string | null;
}

export interface SkillUseResult extends CombatActionResult {
  skillId: string;
  target?: Position;
}

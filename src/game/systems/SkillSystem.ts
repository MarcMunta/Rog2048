import { SKILLS, getSkillById } from '../data/skills';
import { BoardSystem } from './BoardSystem';
import { EnemySystem } from './EnemySystem';
import { RelicSystem } from './RelicSystem';
import type { BoardMoveResult, MergeEvent, Position, SpawnEvent } from '../types/board';
import type { CombatState } from '../types/combat';
import type { SkillDefinition } from '../types/skill';
import type { RunState } from '../types/run';
import { Random, clamp } from '../utils/random';

export interface SkillOperationResult {
  ok: boolean;
  reason?: string;
  skill: SkillDefinition;
  move?: BoardMoveResult;
  merges: MergeEvent[];
  spawns: SpawnEvent[];
  logs: string[];
  paidHp: number;
  energyGained: number;
  shieldGained?: number;
  directDamage?: number;
}

export class SkillSystem {
  static definitions(ids: string[]): SkillDefinition[] {
    return ids.map(getSkillById);
  }

  static getCost(run: RunState, combat: CombatState, skillId: string): number {
    const skill = getSkillById(skillId);
    return RelicSystem.getSkillCost(run, combat, skillId, skill.cost);
  }

  static canUse(run: RunState, combat: CombatState, skillId: string, target?: Position): { ok: boolean; reason?: string } {
    const skill = getSkillById(skillId);
    const state = combat.skillStates.find((item) => item.id === skillId);
    const cost = this.getCost(run, combat, skillId);
    if (!run.skillIds.includes(skillId)) return { ok: false, reason: 'No tienes esa habilidad.' };
    if (state && state.cooldownLeft > 0) return { ok: false, reason: 'Habilidad en recarga.' };
    if (combat.player.energy < cost) return { ok: false, reason: 'Energía insuficiente.' };
    if (skill.targetMode === 'tile' && !target) return { ok: false, reason: 'Elige una ficha.' };
    return { ok: true };
  }

  static use(run: RunState, combat: CombatState, skillId: string, rng: Random, target?: Position): SkillOperationResult {
    const skill = getSkillById(skillId);
    const allowed = this.canUse(run, combat, skillId, target);
    if (!allowed.ok) {
      return {
        ok: false,
        reason: allowed.reason,
        skill,
        merges: [],
        spawns: [],
        logs: [],
        paidHp: 0,
        energyGained: 0
      };
    }

    const cost = this.getCost(run, combat, skillId);
    combat.player.energy -= cost;
    const logs: string[] = [`${skill.name} activada.`];
    const merges: MergeEvent[] = [];
    const spawns: SpawnEvent[] = [];
    let move: BoardMoveResult | undefined;
    let paidHp = 0;
    let energyGained = 0;
    let shieldGained = 0;
    let directDamage = 0;
    const refundAndFail = (reason: string): SkillOperationResult => {
      combat.player.energy = clamp(combat.player.energy + cost, 0, combat.player.maxEnergy);
      return this.failed(skill, reason);
    };

    if (skill.effect === 'compress') {
      move = BoardSystem.compressToCenter(combat.board);
      logs.push('El tablero se pliega al centro.');
    }

    if (skill.effect === 'forge' && target) {
      const steps = RelicSystem.getForgeSteps(run) + Math.floor((run.skillUpgrades[skillId] ?? 0) / 2);
      const tile = BoardSystem.upgradeTile(combat.board, target, steps);
      if (!tile) return refundAndFail('No se puede forjar esa ficha.');
      logs.push(`Ficha mejorada a ${tile.value}.`);
    }

    if (skill.effect === 'purge' && target) {
      const removed = BoardSystem.removeTile(combat.board, target);
      if (!removed) return refundAndFail('No se puede purgar esa ficha.');
      logs.push(`Ficha ${removed.value} purgada.`);
    }

    if (skill.effect === 'duplicate' && target) {
      const spawn = BoardSystem.duplicateTile(combat.board, target, rng);
      if (!spawn) return refundAndFail('Necesitas una ficha de 32 o menos y una casilla libre.');
      spawns.push(spawn);
      logs.push('La ficha se duplica.');
    }

    if (skill.effect === 'freeze' && target) {
      const frozen = BoardSystem.freezeTile(combat.board, target, 2 + Math.min(1, run.skillUpgrades[skillId] ?? 0));
      if (!frozen) return refundAndFail('No se puede congelar esa casilla.');
      logs.push('Ficha congelada.');
    }

    if (skill.effect === 'guard') {
      shieldGained = 5 + (run.skillUpgrades[skillId] ?? 0) * 2 + RelicSystem.getGuardShieldBonus(run);
      combat.player.shield += shieldGained;
      logs.push(`Guardia: +${shieldGained} escudo.`);
    }

    if (skill.effect === 'transmute' && target) {
      const tile = BoardSystem.transmuteTileToPreview(combat.board, target, rng, RelicSystem.getSpawnOptions(run, combat));
      if (!tile) return refundAndFail('No se puede transmutar esa ficha.');
      logs.push(`Ficha transmutada a ${tile.value}.`);
    }

    if (skill.effect === 'execute') {
      const lowHp = combat.enemy.hp / combat.enemy.maxHp <= 0.3;
      directDamage = Math.ceil(combat.enemy.maxHp * (lowHp ? 0.18 : 0.06)) + (run.skillUpgrades[skillId] ?? 0) * 3;
      logs.push(lowHp ? `Sentencia: ${directDamage} daÃ±o directo.` : `Sentencia marca ${directDamage} daÃ±o.`);
    }

    if (skill.effect === 'rerollTarget') {
      EnemySystem.rerollTarget(combat.enemy, rng);
      combat.player.energy = clamp(combat.player.energy + 1, 0, combat.player.maxEnergy);
      energyGained = 1;
      logs.push('El objetivo cambia y recuperas energía.');
    }

    if (skill.effect === 'bloodMerge') {
      if (combat.player.hp <= 3) return refundAndFail('Necesitas más vida para pagar sangre.');
      const merge = BoardSystem.forceMergePair(combat.board);
      if (!merge) return refundAndFail('No hay pares iguales para fusionar.');
      combat.player.hp -= 3;
      paidHp = 3;
      merges.push(merge);
      logs.push(`Sangre por ${merge.value}.`);
    }

    if (skill.effect === 'oraclePreview') {
      BoardSystem.setPreview(combat.board, [8, 4, 4]);
      logs.push('Las próximas fichas quedan fijadas.');
    }

    this.startCooldown(combat, skill);
    return {
      ok: true,
      skill,
      move,
      merges,
      spawns,
      logs,
      paidHp,
      energyGained,
      shieldGained,
      directDamage
    };
  }

  static tickCooldowns(combat: CombatState): void {
    combat.skillStates.forEach((state) => {
      state.cooldownLeft = Math.max(0, state.cooldownLeft - 1);
    });
  }

  static all(): SkillDefinition[] {
    return SKILLS;
  }

  private static startCooldown(combat: CombatState, skill: SkillDefinition): void {
    const state = combat.skillStates.find((item) => item.id === skill.id);
    if (!state) return;
    state.cooldownLeft = skill.cooldown;
  }

  private static failed(skill: SkillDefinition, reason: string): SkillOperationResult {
    return {
      ok: false,
      reason,
      skill,
      merges: [],
      spawns: [],
      logs: [],
      paidHp: 0,
      energyGained: 0
    };
  }
}

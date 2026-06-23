import { BOSSES, getBossForAct } from '../data/bosses';
import { ELITE_ENEMIES, NORMAL_ENEMIES } from '../data/enemies';
import { BoardSystem } from './BoardSystem';
import { CombatFeedbackSystem } from './CombatFeedbackSystem';
import type { CombatActionResult, CombatState } from '../types/combat';
import type { EnemyBehaviorType, EnemyDefinition, EnemyInstance, EnemyRank } from '../types/enemy';
import type { RunState } from '../types/run';
import { Random, clamp } from '../utils/random';

export class EnemySystem {
  static pick(rank: EnemyRank, act: number, rng: Random): EnemyDefinition {
    if (rank === 'boss') return getBossForAct(act);
    const pool = rank === 'elite' ? ELITE_ENEMIES : NORMAL_ENEMIES;
    const eligible = pool.filter((enemy) => enemy.act <= act + (rank === 'elite' ? 1 : 0));
    return rng.pick(eligible.length > 0 ? eligible : pool);
  }

  static create(definition: EnemyDefinition, act: number, floor: number): EnemyInstance {
    const hpScale = definition.rank === 'boss' ? 1 + act * 0.04 : 1 + Math.max(0, floor - 1) * 0.025;
    const hp = Math.ceil(definition.maxHp * hpScale);
    const damage = definition.attackDamage + Math.max(0, act - 1) * 2;
    return {
      ...definition,
      maxHp: hp,
      hp,
      attackDamage: damage,
      currentTarget: definition.targets[0],
      targetIndex: 0,
      attackTimer: definition.attackEvery,
      specialCounter: 0,
      armorStacks: 0
    };
  }

  static hasBehavior(enemy: EnemyInstance, type: EnemyBehaviorType): boolean {
    return enemy.behaviors.some((behavior) => behavior.type === type);
  }

  static behaviorAmount(enemy: EnemyInstance, type: EnemyBehaviorType, fallback = 0): number {
    return enemy.behaviors.find((behavior) => behavior.type === type)?.amount ?? fallback;
  }

  static advanceTarget(enemy: EnemyInstance): void {
    enemy.targetIndex = (enemy.targetIndex + 1) % enemy.targets.length;
    enemy.currentTarget = enemy.targets[enemy.targetIndex];
  }

  static rerollTarget(enemy: EnemyInstance, rng: Random): void {
    const options = enemy.targets.filter((target) => target !== enemy.currentTarget);
    enemy.currentTarget = rng.pick(options.length > 0 ? options : enemy.targets);
    enemy.targetIndex = enemy.targets.indexOf(enemy.currentTarget);
  }

  static applySpecials(combat: CombatState, run: RunState, result: CombatActionResult, rng: Random): void {
    combat.enemy.specialCounter += 1;
    combat.enemy.behaviors.forEach((behavior) => {
      if (!behavior.every || combat.enemy.specialCounter % behavior.every !== 0) return;
      if (behavior.type === 'mirrorTarget') {
        this.rerollTarget(combat.enemy, rng);
        CombatFeedbackSystem.log(result, `${combat.enemy.name} cambia el objetivo.`);
      }
      if (behavior.type === 'lockTile') {
        const position = BoardSystem.lockRandomTile(combat.board, rng, behavior.amount ?? 2);
        if (position) CombatFeedbackSystem.log(result, `${combat.enemy.name} bloquea una ficha.`);
      }
      if (behavior.type === 'curseValue') {
        const position = BoardSystem.curseRandomTile(combat.board, rng);
        if (position) CombatFeedbackSystem.log(result, `${combat.enemy.name} maldice una ficha.`);
      }
      if (behavior.type === 'bossEntropy') {
        if (rng.chance(0.5)) {
          BoardSystem.curseRandomTile(combat.board, rng);
          CombatFeedbackSystem.log(result, 'El núcleo derrama entropía.');
        } else {
          BoardSystem.lockRandomTile(combat.board, rng, 2);
          CombatFeedbackSystem.log(result, 'El núcleo fija el tablero.');
        }
      }
    });

    if (this.hasBehavior(combat.enemy, 'comboTax') && result.combo < 2) {
      const amount = this.behaviorAmount(combat.enemy, 'comboTax', 1);
      combat.player.energy = Math.max(0, combat.player.energy - amount);
      CombatFeedbackSystem.log(result, 'El diezmo consume energía.');
    }
  }

  static performAttack(combat: CombatState, result: CombatActionResult): void {
    const incoming = combat.enemy.attackDamage;
    const blocked = Math.min(combat.player.shield, incoming);
    combat.player.shield -= blocked;
    const damage = incoming - blocked;
    combat.player.hp = clamp(combat.player.hp - damage, 0, combat.player.maxHp);
    result.enemyAttacked = true;
    result.playerDamaged += damage;
    if (damage > 0) {
      CombatFeedbackSystem.log(result, `${combat.enemy.name} ataca: ${damage} daño.`);
    } else if (blocked > 0) {
      CombatFeedbackSystem.playerBlocked(result);
      CombatFeedbackSystem.log(result, `${combat.enemy.name} ataca: Bloqueado.`);
    } else {
      CombatFeedbackSystem.playerBlocked(result, 'Sin efecto');
      CombatFeedbackSystem.log(result, `${combat.enemy.name} ataca: Sin efecto.`);
    }
  }

  static allBosses(): EnemyDefinition[] {
    return BOSSES;
  }
}

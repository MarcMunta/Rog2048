import { BALANCE } from '../data/balancing';
import { getRelicById } from '../data/relics';
import { BoardSystem } from './BoardSystem';
import { CombatFeedbackSystem } from './CombatFeedbackSystem';
import { EnemySystem } from './EnemySystem';
import { RelicSystem } from './RelicSystem';
import { SkillSystem } from './SkillSystem';
import type { BoardMoveResult, Direction, MergeEvent, Position } from '../types/board';
import type { CombatActionResult, CombatState, DamagePacket } from '../types/combat';
import type { EnemyRank } from '../types/enemy';
import type { NodeType, RunState } from '../types/run';
import { Random, clamp } from '../utils/random';

export class CombatSystem {
  readonly state: CombatState;
  private readonly rng: Random;
  private readonly run: RunState;

  constructor(run: RunState, nodeType: NodeType, rng = new Random(run.seed + run.floor * 997)) {
    this.run = run;
    this.rng = rng;
    const rank = this.rankFromNode(nodeType);
    const enemyDefinition = EnemySystem.pick(rank, run.act, rng);
    const enemy = EnemySystem.create(enemyDefinition, run.act, run.floor);

    if (rank === 'boss' && run.relicIds.some((id) => getRelicById(id).effect === 'bossTargetDown')) {
      enemy.targets = enemy.targets.map((target) => Math.max(2, target / 2));
      enemy.currentTarget = enemy.targets[0];
    }

    const poorSpawns = enemy.behaviors.some((behavior) => behavior.type === 'poorSpawns');
    const betterPreview = run.relicIds.some((id) => getRelicById(id).effect === 'betterPreview');
    const cursedFours = run.relicIds.some((id) => getRelicById(id).effect === 'cursedFours');

    this.state = {
      id: `${enemy.id}-${Date.now()}`,
      status: 'active',
      rank,
      board: BoardSystem.create(BALANCE.boardSize, rng, { poorSpawns, betterPreview, cursedFours }),
      enemy,
      player: {
        hp: run.player.hp,
        maxHp: run.player.maxHp,
        shield: run.player.shield,
        energy: run.player.maxEnergy,
        maxEnergy: run.player.maxEnergy,
        gold: run.player.gold
      },
      turn: 0,
      combo: 0,
      firstMergeEchoed: false,
      exactDuplicated: false,
      delayedDamageBonus: 0,
      eightMergeCounter: 0,
      statusEffects: {
        enemyBurn: 0,
        empowered: 0,
        drained: 0
      },
      skillStates: run.skillIds.map((id) => ({ id, cooldownLeft: 0 })),
      recentLogs: [],
      lastDirection: null,
      selectionHint: null
    };

    this.state.enemy.currentTarget = RelicSystem.adjustTarget(run, this.state, this.state.enemy.currentTarget);
    RelicSystem.onCombatStart(run, this.state);
  }

  applyMove(direction: Direction): CombatActionResult {
    const result = this.emptyResult();
    if (this.state.status !== 'active') return { ...result, ok: false, reason: 'El combate ya terminó.' };

    this.state.firstMergeEchoed = false;
    const spawnOptions = RelicSystem.getSpawnOptions(this.run, this.state);
    const move = BoardSystem.move(this.state.board, direction, this.rng, spawnOptions);
    result.move = move;
    if (!move.moved) {
      if (!BoardSystem.hasValidMoves(this.state.board)) {
        this.applyNoMovesPenalty(result);
        this.checkLoss(result);
        CombatFeedbackSystem.commit(this.state, result);
        return result;
      }
      return { ...result, ok: false, reason: 'Ese movimiento no cambia el tablero.' };
    }

    this.state.turn += 1;
    this.run.stats.turns += 1;
    this.state.lastDirection = direction;
    this.gainEnergy(result, BALANCE.baseMoveEnergy);
    SkillSystem.tickCooldowns(this.state);

    const mergeDamage = this.applyMergeDamage(move.merges, result, 'merge');
    if (mergeDamage > 0) this.applyDamageToEnemy(mergeDamage, result);

    if (move.merges.length > 0) this.state.combo = clamp(this.state.combo + move.merges.length, 0, 99);
    else this.state.combo = 0;
    result.combo = this.state.combo;

    if (result.targetHits === 0 && EnemySystem.hasBehavior(this.state.enemy, 'drainOnDelay')) {
      const drained = this.damagePlayer(EnemySystem.behaviorAmount(this.state.enemy, 'drainOnDelay', 1), result);
      CombatFeedbackSystem.log(result, drained > 0 ? 'La demora drena vida.' : 'La demora queda bloqueada.');
    }

    RelicSystem.afterMove(this.run, this.state, result);
    this.applyBurnDamage(result);
    EnemySystem.applySpecials(this.state, this.run, result, this.rng);

    if (this.state.enemy.hp > 0) {
      this.state.enemy.attackTimer -= 1;
      if (this.state.enemy.attackTimer <= 0) {
        EnemySystem.performAttack(this.state, result);
        this.state.enemy.attackTimer = this.state.enemy.attackEvery;
      }
    }

    if (move.noMovesAfter && this.state.enemy.hp > 0 && this.state.player.hp > 0 && this.state.status === 'active') {
      this.applyNoMovesPenalty(result);
    }

    this.finishAction(result);
    CombatFeedbackSystem.commit(this.state, result);
    return result;
  }

  useSkill(skillId: string, target?: Position): CombatActionResult {
    const result = this.emptyResult();
    if (this.state.status !== 'active') return { ...result, ok: false, reason: 'El combate ya terminó.' };

    const operation = SkillSystem.use(this.run, this.state, skillId, this.rng, target);
    if (!operation.ok) return { ...result, ok: false, reason: operation.reason };

    result.move = operation.move;
    result.logs.push(...operation.logs);
    result.playerDamaged += operation.paidHp;
    result.energyGained += operation.energyGained;
    operation.spawns.forEach((spawn) => {
      result.move ??= {
        moved: true,
        direction: 'up',
        movements: [],
        merges: [],
        spawns: [],
        unlockedTiles: 0,
        noMovesAfter: !BoardSystem.hasValidMoves(this.state.board)
      };
      result.move.spawns.push(spawn);
    });

    const damage = this.applyMergeDamage(operation.merges, result, 'skill');
    if (damage > 0) this.applyDamageToEnemy(damage, result);
    if (operation.merges.length > 0) this.state.combo = clamp(this.state.combo + operation.merges.length, 0, 99);
    result.combo = this.state.combo;
    RelicSystem.onSkillUsed(this.run, this.state, result);
    this.applyBurnDamage(result);
    this.finishAction(result);
    CombatFeedbackSystem.commit(this.state, result);
    return result;
  }

  private applyMergeDamage(merges: MergeEvent[], result: CombatActionResult, source: DamagePacket['source']): number {
    let total = 0;
    for (const merge of merges) {
      this.run.stats.highestTile = Math.max(this.run.stats.highestTile, merge.value);
      const target = this.state.enemy.currentTarget;
      const exact = merge.value === target;
      const targetHit = EnemySystem.hasBehavior(this.state.enemy, 'exactOnly') ? exact : merge.value >= target;
      let amount = targetHit ? Math.floor(merge.value / 4) + Math.floor(target / 4) : Math.floor(merge.value / 16);
      let zeroLabel: string | null = null;

      if (EnemySystem.hasBehavior(this.state.enemy, 'exactOnly') && !exact) {
        amount = 0;
        zeroLabel = 'Resistido';
      }
      if (EnemySystem.hasBehavior(this.state.enemy, 'armor') && !exact) {
        const beforeArmor = amount;
        amount = Math.max(0, amount - EnemySystem.behaviorAmount(this.state.enemy, 'armor', 2));
        if (beforeArmor > 0 && amount === 0) zeroLabel = 'Absorbido';
      }

      let packet: DamagePacket = {
        amount,
        mergeValue: merge.value,
        targetHit,
        exact,
        cursed: merge.cursed,
        source
      };
      packet = RelicSystem.modifyDamage(this.run, this.state, packet);
      total += packet.amount;
      if (packet.amount <= 0 && !zeroLabel && (targetHit || exact)) zeroLabel = 'Sin efecto';

      if (targetHit) {
        result.targetHits += 1;
        EnemySystem.advanceTarget(this.state.enemy);
      }
      if (exact) result.exactHits += 1;
      if (merge.value >= 64 || packet.amount >= 24) result.bigHit = true;
      CombatFeedbackSystem.boardDamage(result, packet.amount, merge.position, zeroLabel);
      if (packet.amount <= 0 && zeroLabel) CombatFeedbackSystem.log(result, `${merge.value}: ${zeroLabel}.`);
      RelicSystem.afterMerge(this.run, this.state, merge, packet, result, this.rng);
    }
    result.damage += total;
    return total;
  }

  private applyDamageToEnemy(damage: number, result: CombatActionResult): void {
    const hpBefore = this.state.enemy.hp;
    this.state.enemy.hp = clamp(this.state.enemy.hp - damage, 0, this.state.enemy.maxHp);
    this.run.stats.damage += damage;
    RelicSystem.afterEnemyDamage(this.run, this.state, hpBefore, damage, result);
    if (this.state.enemy.hp <= 0) {
      this.state.status = 'won';
      CombatFeedbackSystem.log(result, `${this.state.enemy.name} cae.`);
    }
  }

  private applyBurnDamage(result: CombatActionResult): void {
    if (this.state.enemy.hp <= 0 || this.state.statusEffects.enemyBurn <= 0) return;
    const burnDamage = 3 + Math.floor(this.state.combo / 3);
    this.state.statusEffects.enemyBurn -= 1;
    CombatFeedbackSystem.log(result, `Brasa: ${burnDamage} daño.`);
    result.bigHit ||= burnDamage >= 6;
    result.damage += burnDamage;
    this.applyDamageToEnemy(burnDamage, result);
  }

  private applyNoMovesPenalty(result: CombatActionResult): void {
    const reduction = RelicSystem.noMovesDamageReduction(this.run);
    const damage = Math.max(1, BALANCE.baseNoMovesDamage - reduction);
    const taken = this.damagePlayer(damage, result);
    CombatFeedbackSystem.log(result, taken > 0 ? 'Tablero bloqueado: recibes castigo.' : 'Tablero bloqueado: Bloqueado.');
    RelicSystem.afterNoMoves(this.run, this.state, result, this.rng);
  }

  private damagePlayer(amount: number, result: CombatActionResult): number {
    const blocked = Math.min(this.state.player.shield, amount);
    this.state.player.shield -= blocked;
    const damage = amount - blocked;
    this.state.player.hp = clamp(this.state.player.hp - damage, 0, this.state.player.maxHp);
    result.playerDamaged += damage;
    if (damage <= 0 && blocked > 0) CombatFeedbackSystem.playerBlocked(result);
    return damage;
  }

  private gainEnergy(result: CombatActionResult, amount: number): void {
    const before = this.state.player.energy;
    this.state.player.energy = clamp(this.state.player.energy + amount, 0, this.state.player.maxEnergy);
    result.energyGained += this.state.player.energy - before;
  }

  private finishAction(result: CombatActionResult): void {
    this.checkLoss(result);
    if (this.state.status === 'won') {
      this.syncRunPlayer();
      this.run.stats.combats += 1;
      if (this.state.rank === 'elite') this.run.stats.elites += 1;
      if (this.state.rank === 'boss') this.run.stats.bosses += 1;
    }
    if (this.state.status === 'lost') this.syncRunPlayer();
  }

  private checkLoss(result: CombatActionResult): void {
    if (this.state.player.hp > 0 || this.state.status === 'won') return;
    this.state.status = 'lost';
    CombatFeedbackSystem.log(result, 'Caes ante el Núcleo.');
  }

  private syncRunPlayer(): void {
    this.run.player.hp = this.state.player.hp;
    this.run.player.shield = this.state.player.shield;
    this.run.player.gold = this.state.player.gold;
    this.run.player.maxHp = this.state.player.maxHp;
    this.run.player.maxEnergy = this.state.player.maxEnergy;
  }

  private emptyResult(): CombatActionResult {
    return {
      ok: true,
      damage: 0,
      healed: 0,
      shieldGained: 0,
      energyGained: 0,
      goldGained: 0,
      targetHits: 0,
      exactHits: 0,
      combo: this.state.combo,
      enemyAttacked: false,
      playerDamaged: 0,
      bigHit: false,
      logs: [],
      floating: []
    };
  }

  private rankFromNode(nodeType: NodeType): EnemyRank {
    if (nodeType === 'elite') return 'elite';
    if (nodeType === 'boss') return 'boss';
    return 'normal';
  }
}

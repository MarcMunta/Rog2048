import { RELICS, getRelicById } from '../data/relics';
import { BoardSystem, type SpawnOptions } from './BoardSystem';
import { EnemySystem } from './EnemySystem';
import type { CombatActionResult, CombatState, DamagePacket } from '../types/combat';
import type { BoardMoveResult, MergeEvent, SpawnEvent } from '../types/board';
import type { RelicDefinition } from '../types/relic';
import type { RunState } from '../types/run';
import { Random, clamp } from '../utils/random';

export class RelicSystem {
  static has(run: RunState, relicId: string): boolean {
    return run.relicIds.includes(relicId);
  }

  static definitions(run: RunState): RelicDefinition[] {
    return run.relicIds.map(getRelicById);
  }

  static byRarity(rarity?: RelicDefinition['rarity']): RelicDefinition[] {
    return rarity ? RELICS.filter((item) => item.rarity === rarity) : RELICS;
  }

  static getSpawnOptions(run: RunState, combat: CombatState): SpawnOptions {
    const poorSpawns = combat.enemy.behaviors.some((behavior) => behavior.type === 'poorSpawns');
    return {
      poorSpawns,
      betterPreview: run.relicIds.some((id) => getRelicById(id).effect === 'betterPreview'),
      cursedFours: run.relicIds.some((id) => getRelicById(id).effect === 'cursedFours')
    };
  }

  static adjustTarget(run: RunState, combat: CombatState, target: number): number {
    let adjusted = target;
    if (combat.rank === 'boss' && this.hasEffect(run, 'bossTargetDown')) {
      adjusted = Math.max(2, adjusted / 2);
    }
    if ((run.flags.nextTargetDown ?? 0) > 0) {
      adjusted = Math.max(2, adjusted / 2);
      run.flags.nextTargetDown -= 1;
    }
    return adjusted;
  }

  static getSkillCost(run: RunState, combat: CombatState, skillId: string, baseCost: number): number {
    let cost = baseCost - (run.skillUpgrades[skillId] ?? 0);
    if (combat.combo >= 3 && this.hasEffect(run, 'comboSkillDiscount')) cost -= 1;
    if ((run.flags.nextSkillDiscount ?? 0) > 0) cost -= 1;
    return Math.max(0, cost);
  }

  static consumeTemporarySkillDiscount(run: RunState): void {
    if ((run.flags.nextSkillDiscount ?? 0) > 0) run.flags.nextSkillDiscount -= 1;
  }

  static getForgeSteps(run: RunState): number {
    return this.hasEffect(run, 'forgeBoost') ? 2 : 1;
  }

  static getShopOfferBonus(run: RunState): number {
    return this.hasEffect(run, 'extraShopItem') ? 1 : 0;
  }

  static onCombatStart(run: RunState, combat: CombatState): void {
    if (this.hasEffect(run, 'firstSpawnUpgraded')) {
      const firstTile = BoardSystem.occupiedPositions(combat.board)[0];
      if (firstTile) BoardSystem.upgradeTile(combat.board, firstTile, 1);
    }
    if ((run.flags.startingCombo ?? 0) > 0) {
      combat.combo += 1;
      run.flags.startingCombo -= 1;
    }
    if ((run.flags.nextCombatEnergyPenalty ?? 0) > 0) {
      combat.player.energy = Math.max(0, combat.player.energy - 1);
      run.flags.nextCombatEnergyPenalty -= 1;
    }
  }

  static modifyDamage(run: RunState, combat: CombatState, packet: DamagePacket): DamagePacket {
    let amount = packet.amount;
    if (packet.exact && this.hasEffect(run, 'exactDouble')) amount *= 2;
    if (!combat.firstMergeEchoed && packet.source === 'merge' && this.hasEffect(run, 'echoFirstMerge')) {
      amount += Math.ceil(packet.amount / 2);
      combat.firstMergeEchoed = true;
    }
    if (packet.cursed && this.hasEffect(run, 'cursedFours')) amount += 7;
    if (packet.targetHit && combat.delayedDamageBonus > 0) {
      amount += combat.delayedDamageBonus;
      combat.delayedDamageBonus = 0;
    }
    if (combat.player.hp / combat.player.maxHp <= 0.4 && this.hasEffect(run, 'lowHpDamage')) {
      amount = Math.ceil(amount * 1.5);
    }
    return { ...packet, amount };
  }

  static afterMerge(
    run: RunState,
    combat: CombatState,
    merge: MergeEvent,
    packet: DamagePacket,
    result: CombatActionResult,
    rng: Random
  ): void {
    if (merge.value <= 8 && this.hasEffect(run, 'lowMergeEnergy')) {
      this.gainEnergy(combat, result, 1);
    }
    if (merge.value === 8 && this.hasEffect(run, 'thirdEightCreates16')) {
      combat.eightMergeCounter += 1;
      if (combat.eightMergeCounter % 3 === 0) {
        const spawn = BoardSystem.addTileValue(combat.board, 16, rng, false);
        if (spawn) {
          this.ensureMove(result, combat).spawns.push(spawn);
          this.pushSpawnFloat(result, spawn, '+16', 'energy');
          result.logs.push('La Puerta del Ocho crea un 16.');
        }
      }
    }
    if (packet.cursed && this.hasEffect(run, 'cursedFours')) {
      this.damagePlayer(combat, result, 1);
      result.logs.push('La maldición muerde.');
    }
    if (merge.value >= 128 && this.hasEffect(run, 'healOn128')) {
      this.heal(combat, result, 4);
      result.floating.push({
        text: '+4 vida',
        x: merge.position.col,
        y: merge.position.row,
        tone: 'heal'
      });
    }
    if (merge.value >= 64 && this.hasEffect(run, 'delayOnBigMerge')) {
      combat.enemy.attackTimer += 1;
      result.logs.push('La campana retrasa el ataque.');
    }
    if (packet.targetHit && this.hasEffect(run, 'goldOnTarget')) {
      const amount = getRelicById('coinMagnet').value ?? 2;
      combat.player.gold += amount;
      run.player.gold += amount;
      result.goldGained += amount;
      result.floating.push({
        text: `+${amount} oro`,
        x: merge.position.col,
        y: merge.position.row,
        tone: 'gold'
      });
    }
    if (packet.exact && this.hasEffect(run, 'exactCombo')) {
      combat.combo += getRelicById('moonLedger').value ?? 2;
    }
    if (packet.exact && this.hasEffect(run, 'exactDuplicate') && !combat.exactDuplicated) {
      const lowTiles = BoardSystem.occupiedPositions(combat.board).filter((position) => {
        const tile = BoardSystem.tileAt(combat.board, position);
        return tile !== null && tile.value <= 16;
      });
      const source = lowTiles.length > 0 ? rng.pick(lowTiles) : null;
      if (source && BoardSystem.duplicateTile(combat.board, source, rng)) {
        combat.exactDuplicated = true;
        result.logs.push('La semilla prisma copia una ficha baja.');
      }
    }
  }

  static afterMove(run: RunState, combat: CombatState, result: CombatActionResult): void {
    if (result.move && result.move.unlockedTiles > 0 && this.hasEffect(run, 'unlockShield')) {
      this.gainShield(combat, result, result.move.unlockedTiles * 2);
    }
    if (combat.combo >= 4 && this.hasEffect(run, 'comboBurn')) {
      combat.statusEffects.enemyBurn = Math.max(combat.statusEffects.enemyBurn, 2);
      result.logs.push('La brasa prende al enemigo.');
    }
    if (combat.turn > 0 && combat.turn % 5 === 0 && this.hasEffect(run, 'turnRerollEnergy')) {
      this.gainEnergy(combat, result, 1);
      EnemySystem.rerollTarget(combat.enemy, new Random(run.seed + combat.turn * 17));
      result.logs.push('La piedra ruleta cambia el objetivo.');
    }
  }

  static afterEnemyDamage(run: RunState, combat: CombatState, hpBefore: number, damage: number, result: CombatActionResult): void {
    if (damage <= 0 || hpBefore > damage) return;
    if (!this.hasEffect(run, 'overkillShield')) return;
    this.gainShield(combat, result, Math.ceil((damage - hpBefore) / 4));
  }

  static noMovesDamageReduction(run: RunState): number {
    return this.hasEffect(run, 'softNoMoves') ? 2 : 0;
  }

  static afterNoMoves(run: RunState, combat: CombatState, result: CombatActionResult, rng: Random): void {
    if (!this.hasEffect(run, 'softNoMoves')) return;
    if (BoardSystem.removeRandomTile(combat.board, rng)) {
      result.logs.push('La máscara rompe una ficha para abrir espacio.');
    }
  }

  static onSkillUsed(run: RunState, combat: CombatState, result: CombatActionResult): void {
    this.consumeTemporarySkillDiscount(run);
    if (this.hasEffect(run, 'bloodEdge')) {
      combat.delayedDamageBonus += getRelicById('bloodEdge').value ?? 3;
      result.logs.push('El filo prepara daño extra.');
    }
  }

  static hasEffect(run: RunState, effect: RelicDefinition['effect']): boolean {
    return run.relicIds.some((id) => getRelicById(id).effect === effect);
  }

  private static gainEnergy(combat: CombatState, result: CombatActionResult, amount: number): void {
    const before = combat.player.energy;
    combat.player.energy = clamp(combat.player.energy + amount, 0, combat.player.maxEnergy);
    const gained = combat.player.energy - before;
    result.energyGained += gained;
  }

  private static gainShield(combat: CombatState, result: CombatActionResult, amount: number): void {
    if (amount <= 0) return;
    combat.player.shield += amount;
    result.shieldGained += amount;
    result.floating.push({ text: `+${amount} escudo`, x: 0, y: 0, tone: 'heal' });
  }

  private static heal(combat: CombatState, result: CombatActionResult, amount: number): void {
    const before = combat.player.hp;
    combat.player.hp = clamp(combat.player.hp + amount, 0, combat.player.maxHp);
    result.healed += combat.player.hp - before;
  }

  private static damagePlayer(combat: CombatState, result: CombatActionResult, amount: number): void {
    const blocked = Math.min(combat.player.shield, amount);
    combat.player.shield -= blocked;
    const damage = amount - blocked;
    combat.player.hp = clamp(combat.player.hp - damage, 0, combat.player.maxHp);
    result.playerDamaged += damage;
  }

  private static ensureMove(result: CombatActionResult, combat: CombatState): BoardMoveResult {
    result.move ??= {
      moved: true,
      direction: combat.lastDirection ?? 'up',
      movements: [],
      merges: [],
      spawns: [],
      unlockedTiles: 0,
      noMovesAfter: !BoardSystem.hasValidMoves(combat.board)
    };
    return result.move;
  }

  private static pushSpawnFloat(result: CombatActionResult, spawn: SpawnEvent, text: string, tone: CombatActionResult['floating'][number]['tone']): void {
    result.floating.push({
      text,
      x: spawn.position.col,
      y: spawn.position.row,
      tone
    });
  }
}

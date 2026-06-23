import { BALANCE } from '../data/balancing';
import { getBossForAct } from '../data/bosses';
import { getClassById } from '../data/classes';
import { RELICS, getRelicById } from '../data/relics';
import { rewardRarityWeights } from '../data/rarities';
import { SKILLS, getSkillById } from '../data/skills';
import type { MapNodeState, NodeType, PendingReward, RewardChoice, RunMapState, RunState } from '../types/run';
import { Random, clamp } from '../utils/random';

export class RunSystem {
  static create(classId: string): RunState {
    const playerClass = getClassById(classId);
    const seed = Date.now() % 2_147_483_647;
    return {
      id: `run-${seed}`,
      seed,
      act: 1,
      floor: 1,
      player: {
        classId,
        hp: playerClass.maxHp,
        maxHp: playerClass.maxHp,
        maxEnergy: playerClass.maxEnergy,
        gold: playerClass.startGold,
        shield: 0
      },
      relicIds: [...playerClass.startingRelics],
      skillIds: [...playerClass.startingSkills],
      skillUpgrades: {},
      map: this.generateMap(1, new Random(seed)),
      currentNodeId: null,
      pendingReward: null,
      flags: {},
      stats: {
        turns: 0,
        damage: 0,
        combats: 0,
        elites: 0,
        bosses: 0,
        highestTile: 0
      }
    };
  }

  static generateMap(act: number, rng: Random): RunMapState {
    const laneCounts = [1, 2, 3, 3, 2, 1];
    const nodes: MapNodeState[] = [];
    laneCounts.forEach((count, depth) => {
      for (let lane = 0; lane < count; lane += 1) {
        nodes.push({
          id: `a${act}-d${depth}-l${lane}`,
          act,
          depth,
          lane,
          type: this.pickNodeType(act, depth, rng),
          nextIds: [],
          cleared: false
        });
      }
    });

    for (let depth = 0; depth < laneCounts.length - 1; depth += 1) {
      const current = nodes.filter((node) => node.depth === depth);
      const next = nodes.filter((node) => node.depth === depth + 1);
      current.forEach((node) => {
        const linked = next.filter((candidate) => {
          if (current.length === 1 || next.length === 1) return true;
          return Math.abs(candidate.lane - node.lane) <= 1;
        });
        node.nextIds = rng
          .shuffle(linked)
          .slice(0, Math.min(linked.length, rng.int(1, Math.min(2, linked.length))))
          .map((candidate) => candidate.id);
      });
    }

    const start = nodes.find((node) => node.depth === 0);
    return {
      act,
      nodes,
      availableNodeIds: start ? [start.id] : [],
      completedNodeIds: []
    };
  }

  static currentNode(run: RunState): MapNodeState | null {
    if (!run.currentNodeId) return null;
    return run.map.nodes.find((node) => node.id === run.currentNodeId) ?? null;
  }

  static chooseNode(run: RunState, nodeId: string): MapNodeState {
    const node = run.map.nodes.find((item) => item.id === nodeId);
    if (!node) throw new Error(`Unknown node ${nodeId}`);
    if (!run.map.availableNodeIds.includes(nodeId)) throw new Error('Node is not available');
    run.currentNodeId = nodeId;
    return node;
  }

  static completeCurrentNode(run: RunState): 'map' | 'victory' {
    const node = this.currentNode(run);
    if (!node) return 'map';
    node.cleared = true;
    run.map.completedNodeIds.push(node.id);
    run.currentNodeId = null;
    run.pendingReward = null;
    run.floor += 1;
    run.player.shield = 0;

    if (node.type === 'boss') {
      if (run.act >= BALANCE.actCount) return 'victory';
      run.act += 1;
      run.map = this.generateMap(run.act, new Random(run.seed + run.act * 4049));
      return 'map';
    }

    run.map.availableNodeIds = node.nextIds;
    return 'map';
  }

  static createReward(run: RunState, source: NodeType, rng = new Random(run.seed + run.floor * 113)): PendingReward {
    const choices: RewardChoice[] = [];
    const forceRare = (run.flags.forceRareRelic ?? 0) > 0;
    if (forceRare) run.flags.forceRareRelic -= 1;

    const rarity = forceRare ? 'rare' : rng.weighted(rewardRarityWeights(source === 'elite'));

    const availableRelics = RELICS.filter((relic) => !run.relicIds.includes(relic.id));
    const availableSkills = SKILLS.filter((skill) => !run.skillIds.includes(skill.id));
    const relicPool = availableRelics.filter((relic) => relic.rarity === rarity);
    const skillPool = availableSkills.filter((skill) => skill.rarity === rarity);

    if (availableRelics.length > 0) {
      const relic = rng.pick(relicPool.length > 0 ? relicPool : availableRelics);
      choices.push({
        id: `relic-${relic.id}`,
        type: 'relic',
        title: relic.name,
        description: relic.description,
        rarity: relic.rarity,
        refId: relic.id
      });
    }

    if (availableSkills.length > 0) {
      const skill = rng.pick(skillPool.length > 0 ? skillPool : availableSkills);
      choices.push({
        id: `skill-${skill.id}`,
        type: 'skill',
        title: skill.name,
        description: skill.description,
        rarity: skill.rarity,
        refId: skill.id
      });
    }

    choices.push({
      id: 'gold',
      type: 'gold',
      title: 'Bolsa de fichas',
      description: `Gana ${source === 'elite' ? 32 : 18} oro.`,
      rarity: 'common',
      amount: source === 'elite' ? 32 : 18
    });

    choices.push({
      id: 'heal',
      type: 'heal',
      title: 'Pulso Reparado',
      description: 'Cura 10 vida.',
      rarity: 'common',
      amount: 10
    });

    const selected = rng.shuffle(choices).slice(0, 3);
    return { source, choices: selected };
  }

  static applyReward(run: RunState, choice: RewardChoice): void {
    if (choice.type === 'relic' && choice.refId && !run.relicIds.includes(choice.refId)) {
      run.relicIds.push(choice.refId);
    }
    if (choice.type === 'skill' && choice.refId && !run.skillIds.includes(choice.refId)) {
      run.skillIds.push(choice.refId);
    }
    if (choice.type === 'gold') {
      run.player.gold += choice.amount ?? 0;
    }
    if (choice.type === 'heal') {
      run.player.hp = clamp(run.player.hp + (choice.amount ?? 0), 0, run.player.maxHp);
    }
    if (choice.type === 'maxHp') {
      run.player.maxHp += choice.amount ?? 0;
      run.player.hp += choice.amount ?? 0;
    }
  }

  static nodeTitle(type: NodeType): string {
    const titles: Record<NodeType, string> = {
      combat: 'Combate',
      elite: 'Élite',
      shop: 'Tienda',
      event: 'Evento',
      rest: 'Descanso',
      boss: 'Jefe'
    };
    return titles[type];
  }

  static bossNameForAct(act: number): string {
    return getBossForAct(act).name;
  }

  private static pickNodeType(act: number, depth: number, rng: Random): NodeType {
    if (depth === 0) return 'combat';
    if (depth === BALANCE.mapDepth - 1) return 'boss';
    if (depth === BALANCE.mapDepth - 2) return rng.pick(['rest', 'shop'] as NodeType[]);
    if (depth === 2 && rng.chance(0.45 + act * 0.05)) return 'elite';
    return rng.weighted<NodeType>([
      { item: 'combat', weight: 48 },
      { item: 'event', weight: 22 },
      { item: 'shop', weight: 14 },
      { item: 'rest', weight: 10 },
      { item: 'elite', weight: 6 + act * 2 }
    ]);
  }
}

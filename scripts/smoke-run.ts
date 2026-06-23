import { CombatSystem } from '../src/game/systems/CombatSystem';
import { RELICS } from '../src/game/data/relics';
import { RARITY_ORDER } from '../src/game/data/rarities';
import { EnemySystem } from '../src/game/systems/EnemySystem';
import { RunSystem } from '../src/game/systems/RunSystem';
import { Random } from '../src/game/utils/random';
import type { CombatActionResult } from '../src/game/types/combat';
import type { Direction } from '../src/game/types/board';

const run = RunSystem.create('forger');
run.seed = 424242;
run.map = RunSystem.generateMap(1, new Random(run.seed));

const firstNode = run.map.availableNodeIds[0];
const node = RunSystem.chooseNode(run, firstNode);
if (node.type !== 'combat') throw new Error(`Expected first combat, got ${node.type}`);

const relicRarities = new Set(RELICS.map((relic) => relic.rarity));
const missingRarities = RARITY_ORDER.filter((rarity) => !relicRarities.has(rarity));
if (missingRarities.length > 0) throw new Error(`Missing relic rarities: ${missingRarities.join(', ')}`);

const combat = new CombatSystem(run, node.type, new Random(7));
combat.state.enemy.hp = Math.min(combat.state.enemy.hp, 16);
combat.state.enemy.maxHp = combat.state.enemy.hp;

const directions: Direction[] = ['left', 'up', 'right', 'down'];
let damageSeen = false;

for (let turn = 0; turn < 80 && combat.state.status === 'active'; turn += 1) {
  const result = combat.applyMove(directions[turn % directions.length]);
  if (!result.ok) continue;
  damageSeen ||= result.damage > 0;
}

if (!damageSeen) throw new Error('No damage generated during smoke combat');
if (combat.state.status !== 'won') throw new Error(`Combat did not end in victory: ${combat.state.status}`);

run.pendingReward = RunSystem.createReward(run, node.type, new Random(8));
RunSystem.applyReward(run, run.pendingReward.choices[0]);
const next = RunSystem.completeCurrentNode(run);

if (next !== 'map') throw new Error(`Expected map after reward, got ${next}`);
if (run.map.availableNodeIds.length === 0) throw new Error('No available map nodes after reward');

const zeroRun = RunSystem.create('accountant');
zeroRun.seed = 10101;
const zeroNode = RunSystem.chooseNode(zeroRun, zeroRun.map.availableNodeIds[0]);
const zeroCombat = new CombatSystem(zeroRun, zeroNode.type, new Random(3));
zeroCombat.state.enemy.behaviors = [{ type: 'exactOnly' }];
zeroCombat.state.enemy.targets = [16];
zeroCombat.state.enemy.currentTarget = 16;
zeroCombat.state.enemy.attackTimer = 99;
zeroCombat.state.board.cells = Array.from({ length: 16 }, () => null);
zeroCombat.state.board.cells[0] = { id: 'z1', value: 2, lockedTurns: 0, cursed: false };
zeroCombat.state.board.cells[1] = { id: 'z2', value: 2, lockedTurns: 0, cursed: false };
zeroCombat.state.board.nextId = 3;
zeroCombat.state.board.spawnPreview = [2, 2, 2];
const zeroResult = zeroCombat.applyMove('left');
if (zeroResult.floating.some((item) => item.text.trim() === '0')) throw new Error('Zero damage floating text leaked');
if (!zeroResult.floating.some((item) => item.text === 'Resistido')) throw new Error('Expected resisted label for zero damage');
if (zeroResult.logs.some((line) => /0\s+daño/i.test(line))) throw new Error('Zero damage combat log leaked');

const blockResult: CombatActionResult = {
  ok: true,
  damage: 0,
  healed: 0,
  shieldGained: 0,
  energyGained: 0,
  goldGained: 0,
  targetHits: 0,
  exactHits: 0,
  combo: 0,
  enemyAttacked: false,
  playerDamaged: 0,
  bigHit: false,
  logs: [],
  floating: []
};
zeroCombat.state.player.shield = 999;
EnemySystem.performAttack(zeroCombat.state, blockResult);
if (blockResult.playerDamaged !== 0) throw new Error('Blocked attack damaged player');
if (!blockResult.logs.some((line) => line.includes('Bloqueado'))) throw new Error('Blocked attack log missing');
if (blockResult.logs.some((line) => /0\s+daño/i.test(line))) throw new Error('Blocked attack logged 0 damage');

console.log('Smoke run passed:', {
  hp: run.player.hp,
  gold: run.player.gold,
  relics: run.relicIds.length,
  skills: run.skillIds.length,
  available: run.map.availableNodeIds.length
});

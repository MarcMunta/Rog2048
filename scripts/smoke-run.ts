import { CombatSystem } from '../src/game/systems/CombatSystem';
import { BoardSystem } from '../src/game/systems/BoardSystem';
import { EconomySystem } from '../src/game/systems/EconomySystem';
import { RELICS } from '../src/game/data/relics';
import { RARITY_ORDER } from '../src/game/data/rarities';
import { EnemySystem } from '../src/game/systems/EnemySystem';
import { RunSystem } from '../src/game/systems/RunSystem';
import { SaveSystem } from '../src/game/systems/SaveSystem';
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

const profile = SaveSystem.loadProfile();
if (profile.tutorial.combatBasics !== false) throw new Error('Profile tutorial flag did not normalize');

const skillRun = RunSystem.create('accountant');
skillRun.skillIds = ['guard', 'transmute', 'execute'];
const skillCombat = new CombatSystem(skillRun, 'combat', new Random(17));
skillCombat.state.player.energy = skillCombat.state.player.maxEnergy;
const shieldBefore = skillCombat.state.player.shield;
const guardResult = skillCombat.useSkill('guard');
if (!guardResult.ok || skillCombat.state.player.shield <= shieldBefore) throw new Error('Guard did not grant shield');
if (guardResult.floating.some((item) => /[+-]?0/.test(item.text))) throw new Error('Guard leaked zero feedback');

skillCombat.state.player.energy = skillCombat.state.player.maxEnergy;
skillCombat.state.board.cells = Array.from({ length: 16 }, () => null);
skillCombat.state.board.cells[0] = { id: 'm1', value: 2, lockedTurns: 0, cursed: false };
skillCombat.state.board.spawnPreview = [8, 4, 2];
const transmuteResult = skillCombat.useSkill('transmute', { row: 0, col: 0 });
if (!transmuteResult.ok) throw new Error(`Transmute failed: ${transmuteResult.reason}`);
if (BoardSystem.tileAt(skillCombat.state.board, { row: 0, col: 0 })?.value !== 8) throw new Error('Transmute did not use preview value');

const bossRun = RunSystem.create('forger');
bossRun.skillIds = ['execute'];
const bossCombat = new CombatSystem(bossRun, 'boss', new Random(23));
bossCombat.state.player.energy = bossCombat.state.player.maxEnergy;
bossCombat.state.enemy.maxHp = 100;
bossCombat.state.enemy.hp = 70;
const bossResult = bossCombat.useSkill('execute');
if (!bossResult.ok) throw new Error(`Execute failed: ${bossResult.reason}`);
if (bossResult.damage <= 0) throw new Error('Execute did no direct damage');
if (bossResult.bossPhaseChanged !== 2) throw new Error('Boss phase 2 did not trigger');
if (!bossResult.logs.some((line) => line.includes('fase 2'))) throw new Error('Boss phase log missing');

const shopRun = RunSystem.create('forger');
shopRun.seed = 123456;
shopRun.player.gold = 999;
const shopOffers = EconomySystem.offers(shopRun);
const shopKeys = shopOffers.map((item) => item.refId ? `${item.type}:${item.refId}` : `item:${item.id}`);
if (new Set(shopKeys).size !== shopKeys.length) throw new Error('Duplicate shop offer refs leaked');

console.log('Smoke run passed:', {
  hp: run.player.hp,
  gold: run.player.gold,
  relics: run.relicIds.length,
  skills: run.skillIds.length,
  available: run.map.availableNodeIds.length
});

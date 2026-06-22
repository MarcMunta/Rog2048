import { CombatSystem } from '../src/game/systems/CombatSystem';
import { RunSystem } from '../src/game/systems/RunSystem';
import { Random } from '../src/game/utils/random';
import type { Direction } from '../src/game/types/board';

const run = RunSystem.create('forger');
run.seed = 424242;
run.map = RunSystem.generateMap(1, new Random(run.seed));

const firstNode = run.map.availableNodeIds[0];
const node = RunSystem.chooseNode(run, firstNode);
if (node.type !== 'combat') throw new Error(`Expected first combat, got ${node.type}`);

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

console.log('Smoke run passed:', {
  hp: run.player.hp,
  gold: run.player.gold,
  relics: run.relicIds.length,
  skills: run.skillIds.length,
  available: run.map.availableNodeIds.length
});

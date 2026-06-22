import { SaveSystem } from './SaveSystem';
import { RunSystem } from './RunSystem';
import { CombatSystem } from './CombatSystem';
import type { ProfileState } from '../types/common';
import type { CombatState } from '../types/combat';
import type { MapNodeState, RewardChoice, RunState } from '../types/run';
import { unique } from '../utils/random';

class GameStore {
  profile: ProfileState = SaveSystem.loadProfile();
  run: RunState | null = SaveSystem.loadRun();
  combat: CombatSystem | null = null;

  reload(): void {
    this.profile = SaveSystem.loadProfile();
    this.run = SaveSystem.loadRun();
  }

  startRun(classId: string): RunState {
    this.run = RunSystem.create(classId);
    this.profile.stats.runsStarted += 1;
    this.discover('discoveredClasses', [classId]);
    this.save();
    return this.run;
  }

  continueRun(): RunState | null {
    this.run = SaveSystem.loadRun();
    return this.run;
  }

  chooseNode(nodeId: string): MapNodeState {
    if (!this.run) throw new Error('No active run');
    const node = RunSystem.chooseNode(this.run, nodeId);
    this.save();
    return node;
  }

  startCombat(): CombatState {
    if (!this.run) throw new Error('No active run');
    const node = RunSystem.currentNode(this.run);
    if (!node) throw new Error('No current node');
    this.combat = new CombatSystem(this.run, node.type);
    this.discover('discoveredEnemies', [this.combat.state.enemy.id]);
    return this.combat.state;
  }

  finishCombat(): 'reward' | 'victory' | 'defeat' {
    if (!this.run || !this.combat) throw new Error('No active combat');
    const state = this.combat.state;
    if (state.status === 'lost') {
      this.profile.stats.runsLost += 1;
      this.mergeRunStats(false);
      SaveSystem.saveRun(null);
      this.run = null;
      this.saveProfileOnly();
      return 'defeat';
    }
    if (state.status !== 'won') throw new Error('Combat is not finished');

    this.profile.stats.combatsWon += 1;
    if (state.rank === 'elite') this.profile.stats.elitesDefeated += 1;
    if (state.rank === 'boss') this.profile.stats.bossesDefeated += 1;
    const node = RunSystem.currentNode(this.run);
    if (node?.type === 'boss' && this.run.act >= 3) {
      RunSystem.completeCurrentNode(this.run);
      this.profile.stats.runsWon += 1;
      this.mergeRunStats(true);
      SaveSystem.saveRun(null);
      this.run = null;
      this.saveProfileOnly();
      return 'victory';
    }

    this.run.pendingReward = RunSystem.createReward(this.run, node?.type ?? 'combat');
    this.save();
    return 'reward';
  }

  claimReward(choice: RewardChoice): 'map' | 'victory' {
    if (!this.run) throw new Error('No active run');
    RunSystem.applyReward(this.run, choice);
    if (choice.type === 'relic' && choice.refId) this.discover('discoveredRelics', [choice.refId]);
    const next = RunSystem.completeCurrentNode(this.run);
    this.save();
    return next;
  }

  completeNode(): 'map' | 'victory' {
    if (!this.run) throw new Error('No active run');
    const next = RunSystem.completeCurrentNode(this.run);
    this.save();
    return next;
  }

  save(): void {
    if (this.run) SaveSystem.saveRun(this.run);
    SaveSystem.saveProfile(this.profile);
  }

  saveProfileOnly(): void {
    SaveSystem.saveProfile(this.profile);
  }

  resetAll(): void {
    SaveSystem.resetAll();
    this.profile = SaveSystem.loadProfile();
    this.run = null;
    this.combat = null;
  }

  private mergeRunStats(won: boolean): void {
    if (!this.run) return;
    this.profile.stats.highestTile = Math.max(this.profile.stats.highestTile, this.run.stats.highestTile);
    this.profile.stats.totalDamage += this.run.stats.damage;
    this.profile.stats.goldEarned += this.run.player.gold;
    if (won) this.profile.stats.runsWon = Math.max(1, this.profile.stats.runsWon);
  }

  private discover(key: 'discoveredRelics' | 'discoveredEnemies' | 'discoveredClasses', ids: string[]): void {
    this.profile[key] = unique([...this.profile[key], ...ids]);
  }
}

export const gameStore = new GameStore();

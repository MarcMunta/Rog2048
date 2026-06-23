export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Weighted<T> {
  item: T;
  weight: number;
}

export interface SettingsState {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  screenShake: boolean;
  animationSpeed: number;
  reducedMotion: boolean;
}

export interface RunStats {
  runsStarted: number;
  runsWon: number;
  runsLost: number;
  combatsWon: number;
  elitesDefeated: number;
  bossesDefeated: number;
  highestTile: number;
  totalDamage: number;
  goldEarned: number;
}

export interface TutorialState {
  combatBasics: boolean;
}

export interface ProfileState {
  version: number;
  settings: SettingsState;
  stats: RunStats;
  tutorial: TutorialState;
  discoveredRelics: string[];
  discoveredEnemies: string[];
  discoveredClasses: string[];
}

export const DEFAULT_SETTINGS: SettingsState = {
  masterVolume: 0.65,
  sfxVolume: 0.85,
  musicVolume: 0.35,
  screenShake: true,
  animationSpeed: 1,
  reducedMotion: false
};

export const DEFAULT_STATS: RunStats = {
  runsStarted: 0,
  runsWon: 0,
  runsLost: 0,
  combatsWon: 0,
  elitesDefeated: 0,
  bossesDefeated: 0,
  highestTile: 0,
  totalDamage: 0,
  goldEarned: 0
};

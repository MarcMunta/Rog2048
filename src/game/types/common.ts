export type Rarity = 'common' | 'rare' | 'legendary';

export interface Weighted<T> {
  item: T;
  weight: number;
}

export interface SettingsState {
  masterVolume: number;
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

export interface ProfileState {
  version: number;
  settings: SettingsState;
  stats: RunStats;
  discoveredRelics: string[];
  discoveredEnemies: string[];
  discoveredClasses: string[];
}

export const DEFAULT_SETTINGS: SettingsState = {
  masterVolume: 0.65,
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

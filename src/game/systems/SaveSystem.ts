import { DEFAULT_SETTINGS, DEFAULT_STATS, type ProfileState } from '../types/common';
import type { RunState } from '../types/run';
import { unique } from '../utils/random';

const PROFILE_KEY = 'nucleo2048.profile.v1';
const RUN_KEY = 'nucleo2048.run.v1';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export class SaveSystem {
  private static memoryProfile: ProfileState | null = null;
  private static memoryRun: RunState | null = null;

  static loadProfile(): ProfileState {
    const raw = storage()?.getItem(PROFILE_KEY);
    if (!raw && this.memoryProfile) return structuredClone(this.memoryProfile);
    if (raw) {
      try {
        return this.normalizeProfile(JSON.parse(raw) as Partial<ProfileState>);
      } catch {
        return this.createProfile();
      }
    }
    return this.createProfile();
  }

  static saveProfile(profile: ProfileState): void {
    const normalized = this.normalizeProfile(profile);
    this.memoryProfile = normalized;
    storage()?.setItem(PROFILE_KEY, JSON.stringify(normalized));
  }

  static loadRun(): RunState | null {
    const raw = storage()?.getItem(RUN_KEY);
    if (!raw && this.memoryRun) return structuredClone(this.memoryRun);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RunState;
    } catch {
      return null;
    }
  }

  static saveRun(run: RunState | null): void {
    this.memoryRun = run ? structuredClone(run) : null;
    const store = storage();
    if (!store) return;
    if (run) store.setItem(RUN_KEY, JSON.stringify(run));
    else store.removeItem(RUN_KEY);
  }

  static resetAll(): void {
    this.memoryProfile = null;
    this.memoryRun = null;
    storage()?.removeItem(PROFILE_KEY);
    storage()?.removeItem(RUN_KEY);
  }

  static discover(kind: 'Relics' | 'Enemies' | 'Classes', ids: string[]): void {
    const profile = this.loadProfile();
    const key = `discovered${kind}` as const;
    profile[key] = unique([...profile[key], ...ids]);
    this.saveProfile(profile);
  }

  private static createProfile(): ProfileState {
    return {
      version: 1,
      settings: { ...DEFAULT_SETTINGS },
      stats: { ...DEFAULT_STATS },
      tutorial: { combatBasics: false },
      discoveredRelics: ['silverAbacus', 'forgeHammer', 'blackLotus', 'starAtlas'],
      discoveredEnemies: [],
      discoveredClasses: ['accountant', 'forger', 'heretic', 'oracle']
    };
  }

  private static normalizeProfile(profile: Partial<ProfileState>): ProfileState {
    return {
      version: 1,
      settings: { ...DEFAULT_SETTINGS, ...(profile.settings ?? {}) },
      stats: { ...DEFAULT_STATS, ...(profile.stats ?? {}) },
      tutorial: { combatBasics: false, ...(profile.tutorial ?? {}) },
      discoveredRelics: profile.discoveredRelics ?? [],
      discoveredEnemies: profile.discoveredEnemies ?? [],
      discoveredClasses: profile.discoveredClasses ?? ['accountant', 'forger']
    };
  }
}

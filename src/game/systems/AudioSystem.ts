import { gameStore } from './GameStore';

export type SfxKey =
  | 'button'
  | 'move'
  | 'merge'
  | 'bigMerge'
  | 'damage'
  | 'enemyAttack'
  | 'reward'
  | 'victory'
  | 'defeat';

const SFX: Record<SfxKey, { frequency: number; duration: number; type: OscillatorType; slide?: number }> = {
  button: { frequency: 420, duration: 0.05, type: 'square' },
  move: { frequency: 180, duration: 0.055, type: 'triangle', slide: 60 },
  merge: { frequency: 360, duration: 0.09, type: 'square', slide: 160 },
  bigMerge: { frequency: 210, duration: 0.16, type: 'sawtooth', slide: 420 },
  damage: { frequency: 95, duration: 0.12, type: 'sawtooth', slide: -30 },
  enemyAttack: { frequency: 70, duration: 0.18, type: 'square', slide: 90 },
  reward: { frequency: 520, duration: 0.14, type: 'triangle', slide: 260 },
  victory: { frequency: 440, duration: 0.35, type: 'triangle', slide: 520 },
  defeat: { frequency: 180, duration: 0.35, type: 'sawtooth', slide: -100 }
};

export class AudioSystem {
  private static context: AudioContext | null = null;

  static unlock(): void {
    const context = this.getContext();
    void context?.resume();
  }

  static play(key: SfxKey): void {
    const settings = gameStore.profile.settings;
    const volume = settings.masterVolume * settings.sfxVolume;
    if (volume <= 0) return;
    const context = this.getContext();
    if (!context) return;
    const config = SFX[key];
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, now);
    if (config.slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, config.frequency + config.slide), now + config.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12 * volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + config.duration + 0.02);
  }

  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.context) {
      const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      this.context = new AudioCtor();
    }
    return this.context;
  }
}

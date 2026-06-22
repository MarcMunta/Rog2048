import type { Weighted } from '../types/common';

export class Random {
  private state: number;

  constructor(seed = Date.now()) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  weighted<T>(items: Weighted<T>[]): T {
    const total = items.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = this.next() * total;
    for (const entry of items) {
      roll -= entry.weight;
      if (roll <= 0) return entry.item;
    }
    return items[items.length - 1].item;
  }

  shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

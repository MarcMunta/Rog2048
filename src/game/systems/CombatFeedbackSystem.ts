import type { CombatActionResult, CombatState, FloatingTextEvent } from '../types/combat';
import type { Position } from '../types/board';

const FLOAT_LIMIT_PER_LABEL = 1;
const MAX_RECENT_LOGS = 6;

export class CombatFeedbackSystem {
  static floating(result: CombatActionResult, event: FloatingTextEvent): void {
    if (!this.isUseful(event.text)) return;
    if ((event.tone === 'blocked' || event.tone === 'status') && this.countLabel(result, event.text) >= FLOAT_LIMIT_PER_LABEL) return;
    result.floating.push(event);
  }

  static boardDamage(result: CombatActionResult, amount: number, position: Position, zeroLabel: string | null): void {
    if (amount > 0) {
      this.floating(result, {
        text: `-${amount}`,
        x: position.col,
        y: position.row,
        tone: 'damage'
      });
      return;
    }
    if (!zeroLabel) return;
    this.floating(result, {
      text: zeroLabel,
      x: position.col,
      y: position.row,
      tone: zeroLabel === 'Absorbido' || zeroLabel === 'Bloqueado' ? 'blocked' : 'status'
    });
  }

  static playerBlocked(result: CombatActionResult, label = 'Bloqueado'): void {
    this.floating(result, { text: label, x: 0, y: 0, tone: 'blocked', anchor: 'player' });
  }

  static playerDamage(result: CombatActionResult, damage: number): void {
    if (damage <= 0) return;
    this.floating(result, { text: `-${damage}`, x: 0, y: 0, tone: 'danger', anchor: 'player' });
  }

  static playerHeal(result: CombatActionResult, amount: number, position?: Position): void {
    if (amount <= 0) return;
    this.floating(result, {
      text: `+${amount} vida`,
      x: position?.col ?? 0,
      y: position?.row ?? 0,
      tone: 'heal',
      anchor: position ? 'board' : 'player'
    });
  }

  static shield(result: CombatActionResult, amount: number): void {
    if (amount <= 0) return;
    this.floating(result, { text: `+${amount} escudo`, x: 0, y: 0, tone: 'heal', anchor: 'player' });
  }

  static log(result: CombatActionResult, text: string): void {
    if (!this.isUseful(text)) return;
    if (/\b0\s+da(?:ñ|Ã±)o\b/i.test(text)) return;
    if (result.logs[result.logs.length - 1] === text) return;
    result.logs.push(text);
  }

  static commit(combat: CombatState, result: CombatActionResult): void {
    const clean = result.logs.filter((line) => this.isUseful(line) && !/\b0\s+da(?:ñ|Ã±)o\b/i.test(line));
    if (clean.length === 0) return;
    combat.recentLogs = [...clean, ...combat.recentLogs].slice(0, MAX_RECENT_LOGS);
    result.logs = clean;
  }

  private static isUseful(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;
    if (trimmed === '0' || trimmed === '+0' || trimmed === '-0') return false;
    if (/^[+-]?0(?:\s|$)/.test(trimmed)) return false;
    return true;
  }

  private static countLabel(result: CombatActionResult, text: string): number {
    return result.floating.filter((item) => item.text === text).length;
  }
}

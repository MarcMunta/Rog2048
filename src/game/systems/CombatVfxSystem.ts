import Phaser from 'phaser';
import { AnimationSystem } from './AnimationSystem';

export interface CombatVfxAnchors {
  board: { x: number; y: number };
  player: { x: number; y: number };
  enemy: { x: number; y: number };
  enemyColor: number;
}

export class CombatVfxSystem {
  static playSkill(scene: Phaser.Scene, skillId: string, anchors: CombatVfxAnchors): void {
    if (skillId === 'guard') {
      AnimationSystem.shockwave(scene, anchors.player.x, anchors.player.y, 0x67e8f9);
      AnimationSystem.burst(scene, anchors.player.x, anchors.player.y, 0x67e8f9);
      return;
    }
    if (skillId === 'transmute') {
      AnimationSystem.shockwave(scene, anchors.board.x, anchors.board.y, 0xb388ff);
      AnimationSystem.mergeStreak(scene, anchors.board.x, anchors.board.y, 0xb388ff);
      return;
    }
    if (skillId === 'execute') {
      AnimationSystem.attackSlash(scene, anchors.board.x, anchors.board.y, anchors.enemy.x, anchors.enemy.y, 0xff4d8d);
      AnimationSystem.hitSparks(scene, anchors.enemy.x, anchors.enemy.y, 0xff4d8d, true);
      return;
    }
    AnimationSystem.burst(scene, anchors.board.x, anchors.board.y, anchors.enemyColor);
  }
}

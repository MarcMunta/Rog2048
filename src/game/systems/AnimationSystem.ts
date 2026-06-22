import Phaser from 'phaser';
import { gameStore } from './GameStore';

export class AnimationSystem {
  static duration(base: number): number {
    const settings = gameStore.profile.settings;
    if (settings.reducedMotion) return 1;
    return base / Math.max(0.25, settings.animationSpeed);
  }

  static shake(scene: Phaser.Scene, intensity = 0.006, duration = 120): void {
    const settings = gameStore.profile.settings;
    if (!settings.screenShake || settings.reducedMotion) return;
    scene.cameras.main.shake(duration, intensity);
  }

  static burst(scene: Phaser.Scene, x: number, y: number, color: number): void {
    if (gameStore.profile.settings.reducedMotion) return;
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const distance = 28 + Math.random() * 28;
      const particle = scene.add.rectangle(x, y, 5, 5, color, 1).setDepth(60);
      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: this.duration(360),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  static shockwave(scene: Phaser.Scene, x: number, y: number, color: number): void {
    if (gameStore.profile.settings.reducedMotion) return;
    const ring = scene.add.circle(x, y, 10).setStrokeStyle(3, color, 0.75).setDepth(58);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: ring,
      radius: 72,
      alpha: 0,
      duration: this.duration(420),
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  static mergeStreak(scene: Phaser.Scene, x: number, y: number, color: number): void {
    if (gameStore.profile.settings.reducedMotion) return;
    for (let i = 0; i < 4; i += 1) {
      const streak = scene.add.rectangle(x, y, 46, 3, color, 0.78).setDepth(59);
      streak.setBlendMode(Phaser.BlendModes.ADD);
      streak.setAngle(i * 45);
      scene.tweens.add({
        targets: streak,
        scaleX: 1.9,
        alpha: 0,
        duration: this.duration(260),
        ease: 'Quad.easeOut',
        onComplete: () => streak.destroy()
      });
    }
  }

  static floatingText(scene: Phaser.Scene, x: number, y: number, text: string, color = '#ffffff'): void {
    const label = scene.add
      .text(x, y, text, {
        fontFamily: 'Courier New, monospace',
        fontSize: '22px',
        color,
        stroke: '#080816',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(80);
    scene.tweens.add({
      targets: label,
      y: y - 48,
      alpha: 0,
      scale: 1.25,
      duration: this.duration(620),
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy()
    });
  }
}

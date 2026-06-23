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

  static hitStop(scene: Phaser.Scene, duration = 70): void {
    if (gameStore.profile.settings.reducedMotion) return;
    const previous = scene.tweens.timeScale;
    scene.tweens.timeScale = 0.08;
    window.setTimeout(() => {
      if (scene.scene.isActive()) scene.tweens.timeScale = previous;
    }, duration);
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

  static energyBolt(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number, color: number, big = false, onImpact?: () => void): void {
    if (gameStore.profile.settings.reducedMotion) {
      onImpact?.();
      return;
    }
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
    const distance = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    const bolt = scene.add.rectangle(fromX, fromY, big ? 18 : 12, big ? 7 : 5, color, 0.96).setDepth(76);
    const trail = scene.add.rectangle(fromX, fromY, Math.max(38, distance * 0.28), big ? 5 : 3, color, 0.34).setDepth(75);
    bolt.setBlendMode(Phaser.BlendModes.ADD);
    trail.setBlendMode(Phaser.BlendModes.ADD);
    bolt.setAngle(Phaser.Math.RadToDeg(angle));
    trail.setOrigin(1, 0.5).setAngle(Phaser.Math.RadToDeg(angle));
    scene.tweens.add({
      targets: bolt,
      x: toX,
      y: toY,
      scaleX: big ? 1.45 : 1,
      duration: this.duration(big ? 260 : 190),
      ease: 'Cubic.easeIn',
      onComplete: () => {
        bolt.destroy();
        this.hitSparks(scene, toX, toY, color, big);
        onImpact?.();
      }
    });
    scene.tweens.add({
      targets: trail,
      x: toX,
      y: toY,
      alpha: 0,
      scaleX: 1.8,
      duration: this.duration(big ? 300 : 220),
      ease: 'Cubic.easeOut',
      onComplete: () => trail.destroy()
    });
  }

  static hitSparks(scene: Phaser.Scene, x: number, y: number, color: number, big = false): void {
    if (gameStore.profile.settings.reducedMotion) return;
    const count = big ? 18 : 10;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = (big ? 42 : 28) + Math.random() * (big ? 28 : 18);
      const shard = scene.add.rectangle(x, y, big ? 12 : 8, 3, color, 0.92).setDepth(78);
      shard.setBlendMode(Phaser.BlendModes.ADD).setAngle(Phaser.Math.RadToDeg(angle));
      scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0.25,
        duration: this.duration(big ? 420 : 300),
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }
  }

  static attackSlash(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number, color: number): void {
    if (gameStore.profile.settings.reducedMotion) return;
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
    const distance = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    const slash = scene.add.rectangle((fromX + toX) / 2, (fromY + toY) / 2, distance, 7, color, 0.78).setDepth(77);
    slash.setBlendMode(Phaser.BlendModes.ADD).setAngle(Phaser.Math.RadToDeg(angle)).setScale(0.08, 1);
    scene.tweens.add({
      targets: slash,
      scaleX: 1,
      alpha: 0,
      duration: this.duration(220),
      ease: 'Expo.easeOut',
      onComplete: () => slash.destroy()
    });
  }

  static bossPulse(scene: Phaser.Scene, x: number, y: number, color: number): void {
    if (gameStore.profile.settings.reducedMotion) return;
    for (let i = 0; i < 3; i += 1) {
      const ring = scene.add.circle(x, y, 28 + i * 10).setStrokeStyle(3, color, 0.58 - i * 0.12).setDepth(74);
      ring.setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: ring,
        radius: 104 + i * 24,
        alpha: 0,
        duration: this.duration(560 + i * 110),
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy()
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

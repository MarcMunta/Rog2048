import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import { clearUi } from '../utils/dom';

export function autoClearUi(scene: Phaser.Scene): void {
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, clearUi);
}

export function transitionTo(scene: Phaser.Scene, key: string): void {
  scene.cameras.main.fadeOut(160, 8, 8, 22);
  scene.time.delayedCall(170, () => scene.scene.start(key));
}

export function sceneBackground(scene: Phaser.Scene): void {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const graphics = scene.add.graphics().setDepth(-10);
  graphics.fillStyle(0x080816, 1).fillRect(0, 0, width, height);
  graphics.fillStyle(0x40f6d2, 0.055).fillCircle(width * 0.18, height * 0.2, Math.min(width, height) * 0.22);
  graphics.fillStyle(0xff4d8d, 0.045).fillCircle(width * 0.82, height * 0.28, Math.min(width, height) * 0.2);
  graphics.lineStyle(1, 0xffffff, 0.035);
  for (let x = 0; x < width; x += 36) graphics.lineBetween(x, 0, x - height * 0.22, height);
  for (let i = 0; i < 70; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const alpha = 0.18 + Math.random() * 0.5;
    graphics.fillStyle(i % 3 === 0 ? 0x40f6d2 : i % 3 === 1 ? 0xff4d8d : 0xffcc66, alpha);
    graphics.fillRect(x, y, 2, 2);
  }
  if (gameStore.profile.settings.reducedMotion) return;
  for (let i = 0; i < 32; i += 1) {
    const color = i % 3 === 0 ? 0x40f6d2 : i % 3 === 1 ? 0xff4d8d : 0xffcc66;
    const mote = scene.add.rectangle(Math.random() * width, Math.random() * height, 2, 2, color, 0.28).setDepth(-9);
    mote.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: mote,
      x: mote.x + (Math.random() * 80 - 40),
      y: mote.y - (36 + Math.random() * 86),
      alpha: { from: 0.08, to: 0.46 },
      yoyo: true,
      repeat: -1,
      duration: 2600 + Math.random() * 2200,
      ease: 'Sine.easeInOut'
    });
  }
}

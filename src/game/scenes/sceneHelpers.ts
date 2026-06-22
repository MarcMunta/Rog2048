import Phaser from 'phaser';
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
  for (let i = 0; i < 70; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const alpha = 0.18 + Math.random() * 0.5;
    graphics.fillStyle(i % 3 === 0 ? 0x40f6d2 : i % 3 === 1 ? 0xff4d8d : 0xffcc66, alpha);
    graphics.fillRect(x, y, 2, 2);
  }
}

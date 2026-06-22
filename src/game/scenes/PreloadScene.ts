import Phaser from 'phaser';
import { sceneBackground } from './sceneHelpers';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    sceneBackground(this);
    const title = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'ROG2048', {
        fontFamily: 'Courier New, monospace',
        fontSize: '32px',
        color: '#40f6d2',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: title,
      alpha: 0.2,
      yoyo: true,
      repeat: 1,
      duration: 240,
      onComplete: () => this.scene.start('MainMenuScene')
    });
  }
}

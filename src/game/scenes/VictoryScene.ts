import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, setUi } from '../utils/dom';
import { pixelButton } from '../ui/PixelButton';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    AudioSystem.play('victory');
    const stats = gameStore.profile.stats;
    const root = setUi(`<main class="screen">
      <section class="screen-inner menu-grid">
        <div class="title-stack">
          <span class="eyebrow">Victoria</span>
          <h1>Núcleo sellado</h1>
          <p>Runs ganadas: ${stats.runsWon}. Jefes derrotados: ${stats.bossesDefeated}. Mejor ficha: ${stats.highestTile}.</p>
        </div>
        <div class="button-column">
          ${pixelButton({ id: 'again', label: 'Otra run', icon: '▶' })}
          ${pixelButton({ id: 'menu', label: 'Menú', variant: 'ghost' })}
        </div>
      </section>
    </main>`);
    bindClick(root, '#again', () => transitionTo(this, 'ClassSelectScene'));
    bindClick(root, '#menu', () => transitionTo(this, 'MainMenuScene'));
    this.cameras.main.fadeIn(240, 12, 60, 40);
  }
}

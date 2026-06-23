import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { iconSvg } from '../assets/icons';
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
    const root = setUi(`<main class="screen victory-screen">
      <section class="screen-inner menu-grid end-shell victory-shell">
        <div class="end-core sealed" aria-hidden="true">${iconSvg('gate')}</div>
        <div class="title-stack">
          <span class="eyebrow">Victoria</span>
          <h1>Núcleo sellado</h1>
          <p>Runs ganadas: ${stats.runsWon}. Jefes derrotados: ${stats.bossesDefeated}. Mejor ficha: ${stats.highestTile}.</p>
        </div>
        <div class="end-stat-row">
          <span>${iconSvg('crown')} ${stats.bossesDefeated} jefes</span>
          <span>${iconSvg('star')} ${stats.highestTile} mejor ficha</span>
          <span>${iconSvg('gold')} ${stats.goldEarned} oro</span>
        </div>
        <div class="button-column">
          ${pixelButton({ id: 'again', label: 'Otra run', icon: iconSvg('spark') })}
          ${pixelButton({ id: 'menu', label: 'Menú', variant: 'ghost' })}
        </div>
      </section>
    </main>`);
    bindClick(root, '#again', () => transitionTo(this, 'ClassSelectScene'));
    bindClick(root, '#menu', () => transitionTo(this, 'MainMenuScene'));
    this.cameras.main.fadeIn(240, 12, 60, 40);
  }
}

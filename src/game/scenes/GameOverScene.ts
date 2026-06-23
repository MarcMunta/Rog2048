import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { iconSvg } from '../assets/icons';
import { bindClick, setUi } from '../utils/dom';
import { pixelButton } from '../ui/PixelButton';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    AudioSystem.play('defeat');
    const stats = gameStore.profile.stats;
    const root = setUi(`<main class="screen defeat-screen">
      <section class="screen-inner menu-grid end-shell defeat-shell">
        <div class="end-core broken" aria-hidden="true">${iconSvg('cursed')}</div>
        <div class="title-stack">
          <span class="eyebrow">Derrota</span>
          <h1>El Núcleo te borra</h1>
          <p>Daño total histórico: ${stats.totalDamage}. Mejor ficha: ${stats.highestTile}.</p>
        </div>
        <div class="end-stat-row">
          <span>${iconSvg('blade')} ${stats.totalDamage} daño</span>
          <span>${iconSvg('star')} ${stats.highestTile} mejor ficha</span>
          <span>${iconSvg('combo')} ${stats.combatsWon} combates</span>
        </div>
        <div class="button-column">
          ${pixelButton({ id: 'again', label: 'Nueva partida', icon: iconSvg('reroll') })}
          ${pixelButton({ id: 'menu', label: 'Menú', variant: 'ghost' })}
        </div>
      </section>
    </main>`);
    bindClick(root, '#again', () => transitionTo(this, 'ClassSelectScene'));
    bindClick(root, '#menu', () => transitionTo(this, 'MainMenuScene'));
    this.cameras.main.fadeIn(240, 70, 0, 20);
  }
}

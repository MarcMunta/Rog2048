import Phaser from 'phaser';
import { PLAYER_CLASSES } from '../data/classes';
import { ALL_ENEMIES } from '../data/enemies';
import { BOSSES } from '../data/bosses';
import { RELICS } from '../data/relics';
import { gameStore } from '../systems/GameStore';
import { bindClick, escapeHtml, setUi } from '../utils/dom';
import { pixelButton } from '../ui/PixelButton';
import { rarityLabel } from '../ui/RewardCard';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class CollectionScene extends Phaser.Scene {
  constructor() {
    super('CollectionScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    const profile = gameStore.profile;
    const relics = RELICS.map((relic) => {
      const known = profile.discoveredRelics.includes(relic.id);
      return `<article class="collection-card rarity-${relic.rarity}">
        <span class="card-rarity">${rarityLabel(relic.rarity)}</span>
        <strong>${known ? escapeHtml(relic.name) : '???'}</strong>
        <span>${known ? escapeHtml(relic.description) : 'Descúbrelo durante una run.'}</span>
      </article>`;
    }).join('');
    const classes = PLAYER_CLASSES.map(
      (playerClass) => `<article class="collection-card">
        <strong>${escapeHtml(playerClass.name)}</strong>
        <span>${escapeHtml(playerClass.description)}</span>
      </article>`
    ).join('');
    const enemies = [...ALL_ENEMIES, ...BOSSES]
      .map((enemy) => {
        const known = profile.discoveredEnemies.includes(enemy.id);
        return `<article class="collection-card">
          <strong>${known ? escapeHtml(enemy.name) : '???'}</strong>
          <span>${known ? escapeHtml(enemy.ruleText) : 'Aún no visto.'}</span>
        </article>`;
      })
      .join('');

    const root = setUi(`<main class="screen">
      <section class="screen-inner">
        <div class="top-actions">
          <div>
            <span class="eyebrow">Colección</span>
            <h2>Runas conocidas</h2>
          </div>
          ${pixelButton({ id: 'back', label: 'Volver', variant: 'ghost' })}
        </div>
        <h3>Clases</h3>
        <div class="card-grid">${classes}</div>
        <h3>Talismanes</h3>
        <div class="card-grid">${relics}</div>
        <h3>Enemigos</h3>
        <div class="card-grid">${enemies}</div>
      </section>
    </main>`);
    bindClick(root, '#back', () => transitionTo(this, 'MainMenuScene'));
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }
}

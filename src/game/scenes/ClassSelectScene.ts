import Phaser from 'phaser';
import { PLAYER_CLASSES } from '../data/classes';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, escapeHtml, setUi } from '../utils/dom';
import { pixelButton } from '../ui/PixelButton';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class ClassSelectScene extends Phaser.Scene {
  constructor() {
    super('ClassSelectScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    const cards = PLAYER_CLASSES.map(
      (playerClass) => `<button class="class-card" data-class-id="${playerClass.id}" style="--class-color:${playerClass.palette}">
        <span class="class-swatch"></span>
        <strong>${escapeHtml(playerClass.name)}</strong>
        <small>${escapeHtml(playerClass.subtitle)}</small>
        <span>${escapeHtml(playerClass.description)}</span>
      </button>`
    ).join('');
    const root = setUi(`<main class="screen">
      <section class="screen-inner">
        <div class="top-actions">
          <div>
            <span class="eyebrow">Nueva run</span>
            <h2>Elige clase</h2>
          </div>
          ${pixelButton({ id: 'back', label: 'Volver', variant: 'ghost' })}
        </div>
        <div class="card-grid">${cards}</div>
      </section>
    </main>`);

    bindClick(root, '.class-card', (card) => {
      const classId = card.dataset.classId;
      if (!classId) return;
      AudioSystem.play('reward');
      gameStore.startRun(classId);
      transitionTo(this, 'MapScene');
    });
    bindClick(root, '#back', () => transitionTo(this, 'MainMenuScene'));
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }
}

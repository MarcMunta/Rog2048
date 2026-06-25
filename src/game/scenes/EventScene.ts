import Phaser from 'phaser';
import { EVENTS } from '../data/events';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { Random } from '../utils/random';
import { bindClick, escapeHtml, setUi, showToast } from '../utils/dom';
import { iconSvg } from '../assets/icons';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class EventScene extends Phaser.Scene {
  private choiceLocked = false;

  constructor() {
    super('EventScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    const run = gameStore.run;
    if (!run) {
      transitionTo(this, 'MainMenuScene');
      return;
    }
    this.choiceLocked = false;
    const event = new Random(run.seed + run.floor * 991).pick(EVENTS);
    const choices = event.choices
      .map(
        (choice, index) => `<button class="event-choice" data-choice-id="${choice.id}">
          <span class="choice-icon">${iconSvg(index === 0 ? 'eye' : index === 1 ? 'spark' : 'heart')}</span>
          <strong>${escapeHtml(choice.label)}</strong>
          <span>${escapeHtml(choice.description)}</span>
        </button>`
      )
      .join('');
    const root = setUi(`<main class="screen event-screen">
      <section class="screen-inner event-shell">
        <div class="scene-sigil" aria-hidden="true">?</div>
        <div class="event-portal" aria-hidden="true"></div>
        <div class="top-actions">
          <div>
            <span class="eyebrow">Evento</span>
            <h2>${escapeHtml(event.name)}</h2>
          </div>
        </div>
        <p class="screen-copy">${escapeHtml(event.body)}</p>
        <br />
        <div class="card-grid">${choices}</div>
      </section>
    </main>`);
    bindClick(root, '.event-choice', (button) => {
      if (this.choiceLocked) return;
      const choice = event.choices.find((item) => item.id === button.dataset.choiceId);
      if (!choice || !gameStore.run) return;
      this.choiceLocked = true;
      AudioSystem.play('reward');
      button.classList.add('is-selected');
      this.time.delayedCall(190, () => {
        if (!gameStore.run) return;
        const message = choice.apply(gameStore.run);
        showToast(message, 'neutral');
        gameStore.completeNode();
        transitionTo(this, 'MapScene');
      });
    });
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }
}

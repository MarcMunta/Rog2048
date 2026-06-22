import Phaser from 'phaser';
import { EVENTS } from '../data/events';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { Random } from '../utils/random';
import { bindClick, escapeHtml, setUi, showToast } from '../utils/dom';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class EventScene extends Phaser.Scene {
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
    const event = new Random(run.seed + run.floor * 991).pick(EVENTS);
    const choices = event.choices
      .map(
        (choice) => `<button class="event-choice" data-choice-id="${choice.id}">
          <strong>${escapeHtml(choice.label)}</strong>
          <span>${escapeHtml(choice.description)}</span>
        </button>`
      )
      .join('');
    const root = setUi(`<main class="screen">
      <section class="screen-inner">
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
      const choice = event.choices.find((item) => item.id === button.dataset.choiceId);
      if (!choice || !gameStore.run) return;
      const message = choice.apply(gameStore.run);
      showToast(message, 'neutral');
      AudioSystem.play('reward');
      gameStore.completeNode();
      transitionTo(this, 'MapScene');
    });
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }
}

import Phaser from 'phaser';
import { PLAYER_CLASSES } from '../data/classes';
import { getRelicById } from '../data/relics';
import { getSkillById } from '../data/skills';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { iconSvg, relicIconSvg, skillIconSvg } from '../assets/icons';
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
        <span class="class-sigil">${classSigil(playerClass.id)}</span>
        <span class="class-swatch"></span>
        <strong>${escapeHtml(playerClass.name)}</strong>
        <small>${escapeHtml(playerClass.subtitle)}</small>
        <span>${escapeHtml(playerClass.description)}</span>
        <span class="loadout-row">${classLoadout(playerClass.startingRelics, playerClass.startingSkills)}</span>
      </button>`
    ).join('');
    const root = setUi(`<main class="screen">
      <section class="screen-inner class-shell">
        <div class="scene-sigil" aria-hidden="true">RUN</div>
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

function classSigil(classId: string): string {
  const icons: Record<string, string> = {
    accountant: iconSvg('abacus'),
    forger: iconSvg('forge'),
    heretic: iconSvg('blood'),
    oracle: iconSvg('oracle')
  };
  return icons[classId] ?? iconSvg('spark');
}

function classLoadout(relicIds: string[], skillIds: string[]): string {
  const relics = relicIds
    .map((id) => {
      const relic = getRelicById(id);
      return `<i class="loadout-chip rarity-${relic.rarity}" title="${escapeHtml(relic.name)}">${relicIconSvg(relic.id, relic.name, relic.rarity)}</i>`;
    })
    .join('');
  const skills = skillIds
    .map((id) => {
      const skill = getSkillById(id);
      return `<i class="loadout-chip rarity-${skill.rarity}" title="${escapeHtml(skill.name)}">${skillIconSvg(skill.id, skill.name)}</i>`;
    })
    .join('');
  return `${relics}${skills}`;
}

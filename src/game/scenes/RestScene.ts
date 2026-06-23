import Phaser from 'phaser';
import { getSkillById } from '../data/skills';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, setUi, showToast } from '../utils/dom';
import { clamp } from '../utils/random';
import { iconSvg } from '../assets/icons';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class RestScene extends Phaser.Scene {
  constructor() {
    super('RestScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    const run = gameStore.run;
    if (!run) {
      transitionTo(this, 'MainMenuScene');
      return;
    }
    const root = setUi(`<main class="screen rest-screen">
      <section class="screen-inner rest-shell">
        <div class="scene-sigil" aria-hidden="true">Z</div>
        <div class="rest-fire" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="top-actions">
          <div>
            <span class="eyebrow">Descanso</span>
            <h2>Elige una acción</h2>
          </div>
        </div>
        <div class="card-grid">
          <button class="rest-card" data-action="heal"><span class="choice-icon">${iconSvg('hp')}</span><strong>Reposar</strong><span>Cura 35% de tu vida máxima.</span></button>
          <button class="rest-card" data-action="upgrade"><span class="choice-icon">${iconSvg('spark')}</span><strong>Afilar habilidad</strong><span>Mejora tu primera habilidad. Menos coste.</span></button>
          <button class="rest-card" data-action="maxhp"><span class="choice-icon">${iconSvg('heart')}</span><strong>Marcar piel</strong><span>Gana +4 vida máxima.</span></button>
        </div>
      </section>
    </main>`);
    bindClick(root, '.rest-card', (card) => {
      if (!gameStore.run) return;
      const action = card.dataset.action;
      if (action === 'heal') {
        const amount = Math.ceil(gameStore.run.player.maxHp * 0.35);
        const before = gameStore.run.player.hp;
        gameStore.run.player.hp = clamp(gameStore.run.player.hp + amount, 0, gameStore.run.player.maxHp);
        const healed = gameStore.run.player.hp - before;
        showToast(healed > 0 ? `Curas ${healed}.` : 'Vida completa.', healed > 0 ? 'good' : 'neutral');
      }
      if (action === 'upgrade') {
        const skillId = gameStore.run.skillIds[0];
        gameStore.run.skillUpgrades[skillId] = (gameStore.run.skillUpgrades[skillId] ?? 0) + 1;
        showToast(`${getSkillById(skillId).name} mejorada.`, 'good');
      }
      if (action === 'maxhp') {
        gameStore.run.player.maxHp += 4;
        gameStore.run.player.hp += 4;
        showToast('+4 vida máxima.', 'good');
      }
      AudioSystem.play('reward');
      gameStore.completeNode();
      transitionTo(this, 'MapScene');
    });
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }
}

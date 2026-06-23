import Phaser from 'phaser';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, setUi } from '../utils/dom';
import { rewardCard } from '../ui/RewardCard';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class RewardScene extends Phaser.Scene {
  constructor() {
    super('RewardScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    const run = gameStore.run;
    const reward = run?.pendingReward;
    if (!run || !reward) {
      transitionTo(this, 'MapScene');
      return;
    }
    const cards = reward.choices.map(rewardCard).join('');
    const root = setUi(`<main class="screen reward-screen">
      <section class="screen-inner reward-shell">
        <div class="scene-sigil" aria-hidden="true">2048</div>
        <div class="scene-orbit" aria-hidden="true"></div>
        <div class="top-actions">
          <div>
            <span class="eyebrow">Recompensa · ${reward.source === 'elite' ? 'Botín de élite' : reward.source === 'boss' ? 'Reliquia de jefe' : 'Tesoro de run'}</span>
            <h2>Elige una mejora</h2>
          </div>
        </div>
        <div class="card-grid">${cards}</div>
      </section>
    </main>`);

    bindClick(root, '.reward-card', (card) => {
      const choice = reward.choices.find((item) => item.id === card.dataset.choiceId);
      if (!choice) return;
      AudioSystem.play('reward');
      card.classList.add('is-selected');
      root.querySelectorAll<HTMLElement>('.reward-card').forEach((item) => {
        if (item !== card) item.style.opacity = '0.45';
      });
      this.time.delayedCall(190, () => {
        const next = gameStore.claimReward(choice);
        transitionTo(this, next === 'victory' ? 'VictoryScene' : 'MapScene');
      });
    });
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }
}

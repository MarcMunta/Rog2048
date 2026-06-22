import Phaser from 'phaser';
import { EconomySystem } from '../systems/EconomySystem';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, escapeHtml, setUi, showToast } from '../utils/dom';
import { pixelButton } from '../ui/PixelButton';
import { rarityLabel } from '../ui/RewardCard';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    this.render();
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }

  private render(): void {
    const run = gameStore.run;
    if (!run) {
      transitionTo(this, 'MainMenuScene');
      return;
    }
    const offers = EconomySystem.offers(run);
    const cards = offers
      .map((item) => {
        const sold = Boolean(run.flags[EconomySystem.purchaseFlag(run, item.id)]);
        return `<article class="shop-card rarity-${item.rarity} ${sold ? 'sold' : ''}">
          <span class="card-rarity">${rarityLabel(item.rarity)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.description)}</span>
          <b class="price-tag">${item.price} oro</b>
          ${pixelButton({ label: sold ? 'Comprado' : 'Comprar', data: { item: item.id }, disabled: sold })}
        </article>`;
      })
      .join('');
    const root = setUi(`<main class="screen">
      <section class="screen-inner">
        <div class="top-actions">
          <div>
            <span class="eyebrow">Tienda</span>
            <h2>Oro: ${run.player.gold}</h2>
          </div>
          ${pixelButton({ id: 'leave-shop', label: 'Salir', variant: 'ghost' })}
        </div>
        <div class="card-grid">${cards}</div>
      </section>
    </main>`);

    bindClick(root, '.shop-card .pixel-button', (button) => {
      const item = offers.find((offer) => offer.id === button.dataset.item);
      if (!item) return;
      const outcome = EconomySystem.purchase(run, item);
      showToast(outcome.message, outcome.ok ? 'good' : 'bad');
      AudioSystem.play(outcome.ok ? 'reward' : 'damage');
      gameStore.save();
      this.render();
    });
    bindClick(root, '#leave-shop', () => {
      gameStore.completeNode();
      transitionTo(this, 'MapScene');
    });
  }
}

import Phaser from 'phaser';
import { EconomySystem } from '../systems/EconomySystem';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, escapeHtml, setUi, showToast } from '../utils/dom';
import { pixelButton } from '../ui/PixelButton';
import { rarityLabel } from '../ui/RewardCard';
import { iconSvg, relicIconSvg, skillIconSvg } from '../assets/icons';
import type { ShopItemDefinition } from '../data/shops';
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
        const unaffordable = !sold && run.player.gold < item.price;
        return `<article class="shop-card rarity-${item.rarity} ${sold ? 'sold' : ''} ${unaffordable ? 'unaffordable' : ''}">
          <span class="shop-icon">${shopIcon(item)}</span>
          <span class="card-rarity">${rarityLabel(item.rarity)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.description)}</span>
          <b class="price-tag">${item.price} oro</b>
          ${pixelButton({ label: sold ? 'Comprado' : unaffordable ? 'Sin oro' : 'Comprar', data: { item: item.id }, disabled: sold || unaffordable })}
        </article>`;
      })
      .join('');
    const root = setUi(`<main class="screen shop-screen">
      <section class="screen-inner shop-shell">
        <div class="scene-sigil" aria-hidden="true">$</div>
        <div class="shop-keeper" aria-hidden="true"><i></i><i></i><b></b></div>
        <div class="top-actions">
          <div>
            <span class="eyebrow">Tienda</span>
            <h2>Mercado de talismanes · ${run.player.gold} oro</h2>
          </div>
          ${pixelButton({ id: 'leave-shop', label: 'Salir', variant: 'ghost' })}
        </div>
        <div class="card-grid">${cards}</div>
      </section>
    </main>`);

    bindClick(root, '.shop-card .pixel-button', (button) => {
      if (button.hasAttribute('disabled')) return;
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

function shopIcon(item: ShopItemDefinition): string {
  if (item.type === 'relic' && item.refId) return relicIconSvg(item.refId, item.title, item.rarity);
  if (item.type === 'skill' && item.refId) return skillIconSvg(item.refId, item.title);
  if (item.type === 'heal') return iconSvg('hp', item.title);
  if (item.type === 'maxHp') return iconSvg('heart', item.title);
  if (item.type === 'upgrade') return iconSvg('spark', item.title);
  return iconSvg('coin', item.title);
}

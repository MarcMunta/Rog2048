import Phaser from 'phaser';
import { RunSystem } from '../systems/RunSystem';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, setUi } from '../utils/dom';
import { mapNode } from '../ui/MapNode';
import { pixelButton } from '../ui/PixelButton';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  create(): void {
    autoClearUi(this);
    sceneBackground(this);
    const run = gameStore.run;
    if (!run) {
      transitionTo(this, 'MainMenuScene');
      return;
    }
    const nodes = run.map.nodes.map((node) => mapNode(node, run.map.availableNodeIds.includes(node.id))).join('');
    const root = setUi(`<main class="screen">
      <section class="screen-inner map-shell">
        <div class="top-actions">
          <div>
            <span class="eyebrow">Acto ${run.act}</span>
            <h2>${run.act < 3 ? 'Ruta al jefe' : 'Ruta al Núcleo'}</h2>
          </div>
          ${pixelButton({ id: 'menu', label: 'Menú', variant: 'ghost' })}
        </div>
        <div class="run-strip">
          <span>Vida ${run.player.hp}/${run.player.maxHp}</span>
          <span>Oro ${run.player.gold}</span>
          <span>Talismanes ${run.relicIds.length}</span>
          <span>Jefe: ${RunSystem.bossNameForAct(run.act)}</span>
        </div>
        <div class="map-board">${nodes}</div>
      </section>
    </main>`);

    bindClick(root, '.map-node.available', (button) => {
      const id = button.dataset.nodeId;
      if (!id) return;
      AudioSystem.play('button');
      const node = gameStore.chooseNode(id);
      const sceneKey = node.type === 'combat' || node.type === 'elite' || node.type === 'boss'
        ? 'CombatScene'
        : node.type === 'shop'
          ? 'ShopScene'
          : node.type === 'event'
            ? 'EventScene'
            : 'RestScene';
      transitionTo(this, sceneKey);
    });
    bindClick(root, '#menu', () => transitionTo(this, 'MainMenuScene'));
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }
}

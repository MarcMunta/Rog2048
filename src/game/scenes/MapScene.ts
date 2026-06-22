import Phaser from 'phaser';
import { RunSystem } from '../systems/RunSystem';
import { gameStore } from '../systems/GameStore';
import { AudioSystem } from '../systems/AudioSystem';
import { bindClick, setUi } from '../utils/dom';
import { mapNode, mapNodeDetail } from '../ui/MapNode';
import { pixelButton } from '../ui/PixelButton';
import type { MapNodeState, NodeType, RunMapState } from '../types/run';
import { autoClearUi, sceneBackground, transitionTo } from './sceneHelpers';

interface MapPoint {
  x: number;
  y: number;
  mobileColumn: number;
}

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

    const selectedNode = this.defaultSelectedNode(run.map);
    const points = this.mapPoints(run.map.nodes);
    const nodes = run.map.nodes
      .map((node, index) =>
        mapNode(node, run.map.availableNodeIds.includes(node.id), {
          ...points.get(node.id)!,
          index,
          selected: node.id === selectedNode?.id
        })
      )
      .join('');

    const root = setUi(`<main class="screen map-screen">
      <section class="screen-inner map-shell">
        <div class="top-actions">
          <div>
            <span class="eyebrow">Acto ${run.act}</span>
            <h2>${run.act < 3 ? 'Ruta al jefe' : 'Ruta al Nucleo'}</h2>
          </div>
          ${pixelButton({ id: 'menu', label: 'Menu', variant: 'ghost' })}
        </div>
        <div class="run-strip">
          <span>Vida ${run.player.hp}/${run.player.maxHp}</span>
          <span>Oro ${run.player.gold}</span>
          <span>Talismanes ${run.relicIds.length}</span>
          <span>Jefe: ${RunSystem.bossNameForAct(run.act)}</span>
        </div>
        <div class="map-frame">
          <div class="map-board" aria-label="Mapa de ruta">
            <div class="map-veil"></div>
            <div class="mobile-spine" aria-hidden="true"></div>
            ${this.connectionSvg(run.map, points)}
            <div class="map-layers">${nodes}</div>
          </div>
          <aside class="map-detail" data-map-detail>
            ${selectedNode ? mapNodeDetail(selectedNode, run.map.availableNodeIds.includes(selectedNode.id)) : ''}
          </aside>
        </div>
      </section>
    </main>`);

    root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const nodeButton = target.closest<HTMLElement>('.map-node');
      if (nodeButton) {
        const id = nodeButton.dataset.nodeId;
        const node = id ? run.map.nodes.find((item) => item.id === id) : null;
        if (!node) return;
        AudioSystem.play('button');
        this.selectNode(root, run.map, node);
        return;
      }

      const enter = target.closest<HTMLElement>('#enter-node');
      if (!enter || enter.hasAttribute('disabled')) return;
      const id = enter.dataset.nodeId;
      if (!id) return;
      AudioSystem.play('button');
      this.startNode(id);
    });
    bindClick(root, '#menu', () => transitionTo(this, 'MainMenuScene'));
    this.cameras.main.fadeIn(180, 8, 8, 22);
  }

  private defaultSelectedNode(map: RunMapState): MapNodeState | null {
    return (
      map.nodes.find((node) => map.availableNodeIds.includes(node.id)) ??
      [...map.nodes].reverse().find((node) => node.cleared) ??
      map.nodes[0] ??
      null
    );
  }

  private selectNode(root: HTMLElement, map: RunMapState, node: MapNodeState): void {
    root.querySelectorAll('.map-node.selected').forEach((element) => element.classList.remove('selected'));
    root.querySelector<HTMLElement>(`.map-node[data-node-id="${node.id}"]`)?.classList.add('selected');
    const detail = root.querySelector<HTMLElement>('[data-map-detail]');
    if (!detail) return;
    detail.innerHTML = mapNodeDetail(node, map.availableNodeIds.includes(node.id));
    detail.classList.remove('sheet-pop');
    void detail.offsetWidth;
    detail.classList.add('sheet-pop');
  }

  private startNode(nodeId: string): void {
    const node = gameStore.chooseNode(nodeId);
    transitionTo(this, this.sceneForNode(node.type));
  }

  private sceneForNode(type: NodeType): string {
    if (type === 'combat' || type === 'elite' || type === 'boss') return 'CombatScene';
    if (type === 'shop') return 'ShopScene';
    if (type === 'event') return 'EventScene';
    return 'RestScene';
  }

  private mapPoints(nodes: MapNodeState[]): Map<string, MapPoint> {
    const maxDepth = Math.max(1, ...nodes.map((node) => node.depth));
    const points = new Map<string, MapPoint>();
    nodes.forEach((node) => {
      const layer = nodes.filter((item) => item.depth === node.depth).sort((a, b) => a.lane - b.lane);
      const order = Math.max(0, layer.findIndex((item) => item.id === node.id));
      const spread = layer.length === 1 ? 0 : order / (layer.length - 1);
      const organicOffset = Math.sin((node.depth + 1) * 1.9 + (node.lane + 1) * 0.7) * 3;
      const y = layer.length === 1 ? 50 + organicOffset * 0.35 : 28 + spread * 44 + organicOffset;
      const x = 9 + (node.depth / maxDepth) * 82;
      const mobileColumn = layer.length === 1 ? 2 : layer.length === 2 ? (node.lane === 0 ? 1 : 3) : node.lane + 1;
      points.set(node.id, {
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        mobileColumn
      });
    });
    return points;
  }

  private connectionSvg(map: RunMapState, points: Map<string, MapPoint>): string {
    const paths = map.nodes
      .flatMap((node) =>
        node.nextIds.map((nextId) => {
          const from = points.get(node.id);
          const to = points.get(nextId);
          if (!from || !to) return '';
          const completed = node.cleared || map.completedNodeIds.includes(node.id);
          const live = map.availableNodeIds.includes(nextId) || map.availableNodeIds.includes(node.id);
          const className = completed ? 'done' : live ? 'live' : 'locked';
          const mid = Math.max(8, (to.x - from.x) * 0.48);
          return `<path class="route-path ${className}" d="M ${from.x} ${from.y} C ${from.x + mid} ${from.y - 5}, ${
            to.x - mid
          } ${to.y + 5}, ${to.x} ${to.y}" />`;
        })
      )
      .join('');
    return `<svg class="map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>`;
  }
}

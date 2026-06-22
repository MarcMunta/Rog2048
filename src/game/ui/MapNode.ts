import { RunSystem } from '../systems/RunSystem';
import type { MapNodeState } from '../types/run';
import { iconSvg } from '../assets/icons';
import { escapeHtml } from '../utils/dom';

export interface MapNodeRenderOptions {
  x: number;
  y: number;
  mobileColumn: number;
  index: number;
  selected?: boolean;
}

export function mapNode(node: MapNodeState, available: boolean, options: MapNodeRenderOptions): string {
  const status = node.cleared ? 'cleared' : available ? 'available current' : 'locked';
  const title = RunSystem.nodeTitle(node.type);
  const selected = options.selected ? 'selected' : '';
  return `<button class="map-node map-node-${node.type} ${status} ${selected}" data-node-id="${node.id}" data-node-type="${
    node.type
  }" data-available="${available ? 'true' : 'false'}" aria-label="${escapeHtml(title)}" style="--lane:${node.lane}; --depth:${
    node.depth
  }; --x:${options.x}%; --y:${options.y}%; --mcol:${options.mobileColumn}; --node-index:${options.index};">
    <span class="node-aura"></span>
    <span class="node-icon">${iconFor(node.type)}</span>
    <span class="node-title">${escapeHtml(title)}</span>
    <span class="node-status">${nodeStatusLabel(node, available)}</span>
  </button>`;
}

export function iconFor(type: MapNodeState['type']): string {
  const icons: Record<MapNodeState['type'], string> = {
    combat: iconSvg('blade'),
    elite: iconSvg('prism'),
    shop: iconSvg('coin'),
    event: iconSvg('eye'),
    rest: iconSvg('heart'),
    boss: iconSvg('ember')
  };
  return icons[type];
}

export function mapNodeDetail(node: MapNodeState, available: boolean): string {
  const title = RunSystem.nodeTitle(node.type);
  return `<div class="map-detail-card map-detail-${node.type}">
    <div class="map-detail-heading">
      <span class="detail-icon">${iconFor(node.type)}</span>
      <div>
        <span class="eyebrow">${node.cleared ? 'Completado' : available ? 'Disponible' : 'Bloqueado'}</span>
        <h3>${escapeHtml(title)}</h3>
      </div>
    </div>
    <p>${nodeDescription(node.type)}</p>
    <div class="map-detail-meta">
      <span>Acto ${node.act}</span>
      <span>Piso ${node.depth + 1}</span>
    </div>
    <button id="enter-node" class="pixel-button ${available ? '' : 'ghost'}" data-node-id="${node.id}" ${available ? '' : 'disabled'}>
      ${available ? 'Entrar' : node.cleared ? 'Ruta tomada' : 'Aun no'}
    </button>
  </div>`;
}

export function nodeDescription(type: MapNodeState['type']): string {
  const descriptions: Record<MapNodeState['type'], string> = {
    combat: 'Enemigo estable. Gana oro y recompensa si sobrevives.',
    elite: 'Reglas agresivas, mas vida y mejores premios.',
    shop: 'Compra talismanes, habilidades o curacion con oro.',
    event: 'Un encuentro raro con coste, riesgo o premio.',
    rest: 'Cura, mejora o prepara el siguiente tramo.',
    boss: 'Puerta final del acto. Cambia la regla central del combate.'
  };
  return descriptions[type];
}

function nodeStatusLabel(node: MapNodeState, available: boolean): string {
  if (node.cleared) return 'OK';
  if (available) return 'Ahora';
  return 'Cerrado';
}

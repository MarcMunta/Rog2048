import { RunSystem } from '../systems/RunSystem';
import type { MapNodeState } from '../types/run';

export function mapNode(node: MapNodeState, available: boolean): string {
  const status = node.cleared ? 'cleared' : available ? 'available' : 'locked';
  return `<button class="map-node map-node-${node.type} ${status}" data-node-id="${node.id}" style="--lane:${node.lane}; --depth:${node.depth};" ${
    available ? '' : 'disabled'
  }>
    <span class="node-icon">${iconFor(node.type)}</span>
    <small>${RunSystem.nodeTitle(node.type)}</small>
  </button>`;
}

export function iconFor(type: MapNodeState['type']): string {
  const icons: Record<MapNodeState['type'], string> = {
    combat: '⚔',
    elite: '◆',
    shop: '¢',
    event: '?',
    rest: '✚',
    boss: '☉'
  };
  return icons[type];
}

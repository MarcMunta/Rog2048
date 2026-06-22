import type { RewardChoice } from '../types/run';
import { escapeHtml } from '../utils/dom';

export function rewardCard(choice: RewardChoice): string {
  return `<button class="reward-card rarity-${choice.rarity}" data-choice-id="${choice.id}">
    <span class="card-rarity">${rarityLabel(choice.rarity)}</span>
    <strong>${escapeHtml(choice.title)}</strong>
    <span>${escapeHtml(choice.description)}</span>
  </button>`;
}

export function rarityLabel(rarity: RewardChoice['rarity']): string {
  const labels: Record<RewardChoice['rarity'], string> = {
    common: 'Común',
    rare: 'Raro',
    legendary: 'Legendario'
  };
  return labels[rarity];
}

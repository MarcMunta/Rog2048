import type { RewardChoice } from '../types/run';
import { iconSvg, relicIconSvg, skillIconSvg } from '../assets/icons';
import { escapeHtml } from '../utils/dom';

export function rewardCard(choice: RewardChoice): string {
  return `<button class="reward-card rarity-${choice.rarity}" data-choice-id="${choice.id}">
    <span class="reward-icon">${rewardIcon(choice)}</span>
    <span class="card-rarity">${rarityLabel(choice.rarity)}</span>
    <strong>${escapeHtml(choice.title)}</strong>
    <span>${escapeHtml(choice.description)}</span>
  </button>`;
}

function rewardIcon(choice: RewardChoice): string {
  if (choice.type === 'relic' && choice.refId) return relicIconSvg(choice.refId, choice.title);
  if (choice.type === 'skill' && choice.refId) return skillIconSvg(choice.refId, choice.title);
  if (choice.type === 'gold') return iconSvg('gold', choice.title);
  if (choice.type === 'heal') return iconSvg('hp', choice.title);
  return iconSvg('spark', choice.title);
}

export function rarityLabel(rarity: RewardChoice['rarity']): string {
  const labels: Record<RewardChoice['rarity'], string> = {
    common: 'Común',
    rare: 'Raro',
    legendary: 'Legendario'
  };
  return labels[rarity];
}

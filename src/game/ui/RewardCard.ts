import type { RewardChoice } from '../types/run';
import { iconSvg, relicIconSvg, skillIconSvg } from '../assets/icons';
import { rarityLabel } from '../data/rarities';
import { escapeHtml } from '../utils/dom';

export { rarityLabel } from '../data/rarities';

export function rewardCard(choice: RewardChoice): string {
  return `<button class="reward-card rarity-${choice.rarity}" data-choice-id="${choice.id}" data-rarity="${choice.rarity}">
    <span class="reward-icon">${rewardIcon(choice)}</span>
    <span class="card-rarity">${rarityLabel(choice.rarity)}</span>
    <strong>${escapeHtml(choice.title)}</strong>
    <span>${escapeHtml(choice.description)}</span>
  </button>`;
}

function rewardIcon(choice: RewardChoice): string {
  if (choice.type === 'relic' && choice.refId) return relicIconSvg(choice.refId, choice.title, choice.rarity);
  if (choice.type === 'skill' && choice.refId) return skillIconSvg(choice.refId, choice.title);
  if (choice.type === 'gold') return iconSvg('gold', choice.title);
  if (choice.type === 'heal') return iconSvg('hp', choice.title);
  return iconSvg('spark', choice.title);
}

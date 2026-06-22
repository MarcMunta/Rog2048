import { getRelicById } from '../data/relics';
import { getSkillById } from '../data/skills';
import { RelicSystem } from '../systems/RelicSystem';
import { SkillSystem } from '../systems/SkillSystem';
import type { CombatState } from '../types/combat';
import type { RunState } from '../types/run';
import { escapeHtml } from '../utils/dom';
import { tooltip } from './Tooltip';

export function combatHud(run: RunState, combat: CombatState, selectingSkillId: string | null): string {
  const enemyHp = Math.ceil((combat.enemy.hp / combat.enemy.maxHp) * 100);
  const playerHp = Math.ceil((combat.player.hp / combat.player.maxHp) * 100);
  const skills = run.skillIds
    .map((skillId) => {
      const skill = getSkillById(skillId);
      const state = combat.skillStates.find((item) => item.id === skillId);
      const cost = SkillSystem.getCost(run, combat, skillId);
      const disabled = (state?.cooldownLeft ?? 0) > 0 || combat.player.energy < cost || combat.status !== 'active';
      const label = state && state.cooldownLeft > 0 ? `${state.cooldownLeft}` : `${cost}E`;
      return `<button class="skill-button rarity-${skill.rarity} ${selectingSkillId === skill.id ? 'selecting' : ''}" data-skill-id="${skill.id}" ${
        disabled ? 'disabled' : ''
      } ${tooltip(skill.description)}>
        <strong>${escapeHtml(skill.name)}</strong>
        <span>${label}</span>
      </button>`;
    })
    .join('');

  const relics = RelicSystem.definitions(run)
    .map((relic) => `<span class="relic-chip rarity-${relic.rarity}" ${tooltip(relic.description)}>${escapeHtml(relic.name)}</span>`)
    .join('');

  return `<section class="combat-hud">
    <div class="hud-card player-card">
      <div class="hud-row"><strong>Vida</strong><span>${combat.player.hp}/${combat.player.maxHp}</span></div>
      <div class="bar"><i style="width:${playerHp}%"></i></div>
      <div class="hud-mini">
        <span>Escudo ${combat.player.shield}</span>
        <span>Oro ${combat.player.gold}</span>
      </div>
    </div>
    <div class="hud-card objective-card">
      <span class="eyebrow">Objetivo</span>
      <strong>${combat.enemy.currentTarget}</strong>
      <span>${escapeHtml(combat.enemy.ruleText)}</span>
      <div class="hud-mini">
        <span>Turno ${combat.turn}</span>
        <span>Combo ${combat.combo}</span>
        <span>Ataque en ${combat.enemy.attackTimer}</span>
      </div>
    </div>
    <div class="hud-card enemy-card">
      <div class="hud-row"><strong>${escapeHtml(combat.enemy.name)}</strong><span>${combat.enemy.hp}/${combat.enemy.maxHp}</span></div>
      <div class="bar danger"><i style="width:${enemyHp}%"></i></div>
      <small>${escapeHtml(combat.enemy.intent)}</small>
    </div>
    <div class="hud-card energy-card">
      <div class="energy-pips">${Array.from({ length: combat.player.maxEnergy }, (_, index) => `<i class="${index < combat.player.energy ? 'filled' : ''}"></i>`).join('')}</div>
      <div class="skill-row">${skills}</div>
    </div>
    <div class="relic-row">${relics}</div>
    ${
      selectingSkillId
        ? `<div class="selection-banner">Elige una ficha para ${escapeHtml(getSkillById(selectingSkillId).name)} · clic derecho/Esc cancela</div>`
        : ''
    }
  </section>`;
}

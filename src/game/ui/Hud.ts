import { getSkillById } from '../data/skills';
import { iconSvg, relicIconSvg, skillIconSvg } from '../assets/icons';
import { RelicSystem } from '../systems/RelicSystem';
import { SkillSystem } from '../systems/SkillSystem';
import type { CombatState } from '../types/combat';
import type { RunState } from '../types/run';
import { escapeHtml } from '../utils/dom';
import { tooltip } from './Tooltip';

export function combatHud(run: RunState, combat: CombatState, selectingSkillId: string | null): string {
  const enemyHp = Math.ceil((combat.enemy.hp / combat.enemy.maxHp) * 100);
  const playerHp = Math.ceil((combat.player.hp / combat.player.maxHp) * 100);
  const skills = run.skillIds.map((skillId) => skillButton(run, combat, skillId, selectingSkillId)).join('');
  const relics = RelicSystem.definitions(run)
    .map(
      (relic) => `<span class="relic-chip rarity-${relic.rarity}" ${tooltip(`${relic.name}: ${relic.description}`)}>
        ${relicIconSvg(relic.id, relic.name)}
      </span>`
    )
    .join('');
  const status = [
    combat.statusEffects.enemyBurn > 0
      ? `<span class="status-chip danger" ${tooltip('Quemado: recibe daño tras tus acciones.')}>${iconSvg('burning')} ${combat.statusEffects.enemyBurn}</span>`
      : '',
    combat.delayedDamageBonus > 0
      ? `<span class="status-chip" ${tooltip('Tu próximo golpe de objetivo suma daño.')}>${iconSvg('empowered')} +${combat.delayedDamageBonus}</span>`
      : ''
  ].join('');
  const preview = combat.board.spawnPreview.map((value) => `<i>${value}</i>`).join('');

  return `<section class="combat-shell">
    <header class="combat-topbar">
      <div class="enemy-title">
        <span class="eyebrow">${rankLabel(combat.rank)}</span>
        <strong>${escapeHtml(combat.enemy.name)}</strong>
        <small>${escapeHtml(combat.enemy.intent)}</small>
      </div>
      <div class="enemy-core">
        <span>OBJ</span>
        <strong>${combat.enemy.currentTarget}</strong>
        <small>${escapeHtml(combat.enemy.ruleText)}</small>
      </div>
      <div class="enemy-vitals">
        <span>${combat.enemy.hp}/${combat.enemy.maxHp}</span>
        <div class="bar danger"><i style="width:${enemyHp}%"></i></div>
        <small>Ataque en ${combat.enemy.attackTimer}</small>
      </div>
      <div class="status-row">${status}</div>
    </header>

    <aside class="player-stack">
      <div class="stat-panel">
        <span>${iconSvg('hp')} Vida</span>
        <strong>${combat.player.hp}/${combat.player.maxHp}</strong>
        <div class="bar"><i style="width:${playerHp}%"></i></div>
      </div>
      <div class="stat-grid-mini">
        <span>${iconSvg('shield')} ${combat.player.shield}</span>
        <span>${iconSvg('energy')} ${combat.player.energy}/${combat.player.maxEnergy}</span>
        <span>${iconSvg('gold')} ${combat.player.gold}</span>
        <span>${iconSvg('combo')} x${combat.combo}</span>
      </div>
      <div class="turn-chip">Turno ${combat.turn}</div>
      <div class="preview-chip"><span>Próx.</span>${preview}</div>
    </aside>

    <aside class="relic-rail">
      <span class="rail-title">Talismanes</span>
      <div class="relic-list">${relics}</div>
    </aside>

    <footer class="skill-dock">
      <div class="dock-title">Habilidades</div>
      <div class="skill-row">${skills}</div>
    </footer>
    ${
      selectingSkillId
        ? `<div class="selection-banner">Elige una ficha para ${escapeHtml(getSkillById(selectingSkillId).name)} · Esc cancela</div>`
        : ''
    }
  </section>`;
}

function skillButton(run: RunState, combat: CombatState, skillId: string, selectingSkillId: string | null): string {
  const skill = getSkillById(skillId);
  const state = combat.skillStates.find((item) => item.id === skillId);
  const cost = SkillSystem.getCost(run, combat, skillId);
  const disabled = (state?.cooldownLeft ?? 0) > 0 || combat.player.energy < cost || combat.status !== 'active';
  const label = state && state.cooldownLeft > 0 ? `${state.cooldownLeft}` : `${cost}E`;
  return `<button class="skill-button rarity-${skill.rarity} ${selectingSkillId === skill.id ? 'selecting' : ''}" data-skill-id="${skill.id}" ${
    disabled ? 'disabled' : ''
  } ${tooltip(skill.description)}>
    <span class="skill-icon">${skillIconSvg(skill.id, skill.name)}</span>
    <span class="skill-copy"><strong>${escapeHtml(skill.name)}</strong><small>${shortSkillText(skill.description)}</small></span>
    <span class="skill-cost">${label}</span>
  </button>`;
}

function shortSkillText(description: string): string {
  return escapeHtml(description.replace(/\.$/, '').split(',')[0]);
}

function rankLabel(rank: CombatState['rank']): string {
  const labels: Record<CombatState['rank'], string> = {
    normal: 'Enemigo',
    elite: 'Élite',
    boss: 'Jefe'
  };
  return labels[rank];
}

import { getSkillById } from '../data/skills';
import { iconSvg, relicIconSvg, skillIconSvg } from '../assets/icons';
import { RelicSystem } from '../systems/RelicSystem';
import { SkillSystem } from '../systems/SkillSystem';
import type { CombatState } from '../types/combat';
import type { RunState } from '../types/run';
import { escapeHtml } from '../utils/dom';
import { tooltip } from './Tooltip';

export function combatHud(run: RunState, combat: CombatState, selectingSkillId: string | null, showTutorial = false): string {
  const enemyHp = Math.ceil((combat.enemy.hp / combat.enemy.maxHp) * 100);
  const playerHp = Math.ceil((combat.player.hp / combat.player.maxHp) * 100);
  const skills = run.skillIds.map((skillId) => skillButton(run, combat, skillId, selectingSkillId)).join('');
  const relics = RelicSystem.definitions(run)
    .map(
      (relic) => `<span class="relic-chip rarity-${relic.rarity}" ${tooltip(`${relic.name}: ${relic.description}`)}>
        ${relicIconSvg(relic.id, relic.name, relic.rarity)}
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
  const intent = enemyIntent(combat);
  const logs = combat.recentLogs.length
    ? combat.recentLogs.map((line) => `<span>${escapeHtml(line)}</span>`).join('')
    : '<span>Sin eventos recientes.</span>';
  const logState = combat.recentLogs.length ? 'has-events' : 'is-empty';
  const logOpen = combat.recentLogs.length && combat.turn <= 2 ? 'open' : '';

  return `<section class="combat-shell ${showTutorial ? 'has-tutorial' : ''}">
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
      <div class="intent-panel ${intent.danger ? 'danger' : ''}">
        <span>${intent.icon}</span>
        <strong>${escapeHtml(intent.label)}</strong>
        <small>${escapeHtml(intent.detail)}</small>
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

    <details class="combat-log ${logState}" ${logOpen}>
      <summary><span>Registro</span><b>${combat.recentLogs.length}</b></summary>
      <div>${logs}</div>
    </details>

    <footer class="skill-dock">
      <div class="dock-title"><span>Habilidades</span><i>${combat.player.energy}/${combat.player.maxEnergy}E</i></div>
      <div class="skill-row">${skills}</div>
    </footer>
    ${showTutorial ? '' : '<div class="mobile-combat-hint">Desliza fichas · toca una habilidad cuando brille</div>'}
    ${showTutorial ? combatTutorial() : ''}
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
  const reason =
    combat.status !== 'active'
      ? 'El combate ya termino.'
      : (state?.cooldownLeft ?? 0) > 0
        ? `Recarga: ${state?.cooldownLeft ?? 0} turno(s).`
        : combat.player.energy < cost
          ? 'Energia insuficiente.'
          : '';
  const label = state && state.cooldownLeft > 0 ? `${state.cooldownLeft}` : `${cost}E`;
  const ariaLabel = `${skill.name}. ${skill.description} Coste ${label}.`;
  return `<button type="button" class="skill-button rarity-${skill.rarity} ${selectingSkillId === skill.id ? 'selecting' : ''} ${
    disabled ? 'is-disabled' : ''
  }" data-skill-id="${skill.id}" data-rarity="${skill.rarity}" data-disabled-reason="${escapeHtml(reason)}" aria-label="${escapeHtml(
    ariaLabel
  )}" aria-disabled="${disabled ? 'true' : 'false'}" ${tooltip(
    disabled && reason ? `${skill.description} ${reason}` : skill.description
  )}>
    <span class="skill-icon">${skillIconSvg(skill.id, skill.name)}</span>
    <span class="skill-copy"><strong class="skill-name">${escapeHtml(skill.name)}</strong><small class="skill-description">${shortSkillText(
      skill.description
    )}</small></span>
    <span class="skill-cost">${label}</span>
    <span class="skill-rune" aria-hidden="true"></span>
  </button>`;
}

function enemyIntent(combat: CombatState): { icon: string; label: string; detail: string; danger: boolean } {
  if (combat.enemy.attackTimer <= 1) {
    return {
      icon: iconSvg('blade'),
      label: 'Ataque listo',
      detail: `${combat.enemy.attackDamage} dano entrante`,
      danger: true
    };
  }

  const timed = combat.enemy.behaviors
    .filter((behavior) => behavior.every)
    .map((behavior) => ({
      type: behavior.type,
      remaining: (behavior.every ?? 1) - (combat.enemy.specialCounter % (behavior.every ?? 1))
    }))
    .sort((a, b) => a.remaining - b.remaining)[0];

  if (timed && timed.remaining <= combat.enemy.attackTimer) {
    const labels: Record<string, { icon: string; label: string }> = {
      mirrorTarget: { icon: iconSvg('reroll'), label: 'Muta objetivo' },
      lockTile: { icon: iconSvg('locked'), label: 'Bloquea ficha' },
      curseValue: { icon: iconSvg('cursed'), label: 'Maldice ficha' },
      bossEntropy: { icon: iconSvg('ember'), label: 'Entropia' }
    };
    const item = labels[timed.type] ?? { icon: iconSvg('eye'), label: 'Ritual' };
    return {
      icon: item.icon,
      label: item.label,
      detail: `En ${timed.remaining} turno(s)`,
      danger: timed.remaining <= 1
    };
  }

  return {
    icon: iconSvg('eye'),
    label: combat.rank === 'boss' ? `Fase ${combat.bossPhase}` : 'Acecha',
    detail: `Ataca en ${combat.enemy.attackTimer}`,
    danger: false
  };
}

function combatTutorial(): string {
  return `<aside class="combat-tutorial" role="dialog" aria-label="Guia rapida">
    <div>
      <span class="eyebrow">Guia rapida</span>
      <strong>Juega al numero objetivo</strong>
      <p>Desliza fichas, fusiona el objetivo, usa habilidades con energia y vigila el contador enemigo.</p>
    </div>
    <button class="tutorial-close" id="dismiss-combat-tutorial">Entendido</button>
  </aside>`;
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

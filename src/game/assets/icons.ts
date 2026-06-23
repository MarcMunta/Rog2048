import type { Rarity } from '../types/common';

export type IconId =
  | 'abacus'
  | 'mirror'
  | 'shield'
  | 'echo'
  | 'ash'
  | 'key'
  | 'eye'
  | 'combo'
  | 'heart'
  | 'coin'
  | 'mask'
  | 'prism'
  | 'blade'
  | 'crown'
  | 'roulette'
  | 'book'
  | 'hammer'
  | 'bell'
  | 'lotus'
  | 'star'
  | 'ember'
  | 'gate'
  | 'spark'
  | 'compress'
  | 'forge'
  | 'purge'
  | 'duplicate'
  | 'freeze'
  | 'reroll'
  | 'blood'
  | 'oracle'
  | 'locked'
  | 'cursed'
  | 'burning'
  | 'drained'
  | 'empowered'
  | 'gold'
  | 'energy'
  | 'hp';

const ICON_PATHS: Record<IconId, string> = {
  abacus: '<path d="M4 5h16M4 11h16M4 17h16M7 3v18M17 3v18"/><rect x="9" y="3" width="3" height="4"/><rect x="13" y="9" width="3" height="4"/><rect x="8" y="15" width="3" height="4"/>',
  mirror: '<path d="M12 3c4 0 7 3 7 7s-3 11-7 11-7-7-7-11 3-7 7-7Z"/><path d="M9 8c1-2 4-3 6-1"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Z"/><path d="M8 12h8"/>',
  echo: '<path d="M6 7h7v7H6z"/><path d="M10 11h7v7h-7z"/><path d="M14 5l4-2 2 4"/>',
  ash: '<path d="M12 3v18M4 12h16"/><path d="M7 7l10 10M17 7 7 17"/>',
  key: '<circle cx="8" cy="9" r="4"/><path d="M12 12l8 8M16 16l2-2M18 18l2-2"/>',
  eye: '<path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="3"/>',
  combo: '<path d="M5 18 19 4"/><path d="M7 5h6v6H7zM11 13h6v6h-6z"/>',
  heart: '<path d="M12 20s-8-5-8-11a4 4 0 0 1 7-3 4 4 0 0 1 7 3c0 6-6 9-6 11Z"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 10c0-2 6-2 6 0 0 3-6 1-6 4 0 2 6 2 6 0"/>',
  mask: '<path d="M4 7c3-2 13-2 16 0v6c0 4-4 7-8 7s-8-3-8-7V7Z"/><path d="M7 11h4M13 11h4M10 16h4"/>',
  prism: '<path d="M12 3 20 17H4L12 3Z"/><path d="M12 3v14M8 17l4-6 4 6"/>',
  blade: '<path d="M5 20 19 6l-1-3-3-1L3 16l2 4Z"/><path d="M12 9l3 3"/>',
  crown: '<path d="M4 18h16L18 7l-4 5-2-8-2 8-4-5-2 11Z"/>',
  roulette: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M7 7l10 10M17 7 7 17"/>',
  book: '<path d="M5 4h6c2 0 3 1 3 3v13c0-2-1-3-3-3H5V4Z"/><path d="M19 4h-5v16c0-2 1-3 3-3h2V4Z"/>',
  hammer: '<path d="M4 20 14 10"/><path d="M11 3h8l2 2-6 6-4-4V3Z"/>',
  bell: '<path d="M6 17h12l-2-3V9a4 4 0 0 0-8 0v5l-2 3Z"/><path d="M10 20h4"/>',
  lotus: '<path d="M12 20c-5-3-5-8 0-14 5 6 5 11 0 14Z"/><path d="M12 20C6 18 3 14 4 9c5 1 8 5 8 11ZM12 20c6-2 9-6 8-11-5 1-8 5-8 11Z"/>',
  star: '<path d="m12 3 2 6 6 1-5 4 2 7-5-4-5 4 2-7-5-4 6-1 2-6Z"/>',
  ember: '<path d="M12 21c-4 0-7-3-7-7 0-5 5-7 6-11 3 3 1 6 4 8 1-2 2-3 2-5 3 3 3 6 2 9-1 4-4 6-7 6Z"/>',
  gate: '<path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-7a3 3 0 0 1 6 0v7"/>',
  spark: '<path d="M13 2 5 14h6l-1 8 9-13h-6l1-7Z"/>',
  compress: '<path d="M4 12h16M12 4v16"/><path d="m8 8 4 4-4 4M16 8l-4 4 4 4"/>',
  forge: '<path d="M4 18h16"/><path d="M7 14h10l-2 4H9l-2-4Z"/><path d="M14 3 8 10h5l-1 5 6-8h-5l1-4Z"/>',
  purge: '<path d="M5 6h14M9 6v12M15 6v12"/><path d="M8 6l1-3h6l1 3M7 6l1 15h8l1-15"/>',
  duplicate: '<path d="M7 7h10v10H7z"/><path d="M4 4h10v10"/>',
  freeze: '<path d="M12 3v18M4 7l16 10M20 7 4 17"/><path d="M8 5l4 4 4-4M8 19l4-4 4 4"/>',
  reroll: '<path d="M5 9a7 7 0 0 1 12-3l2 2"/><path d="M19 4v4h-4M19 15a7 7 0 0 1-12 3l-2-2"/><path d="M5 20v-4h4"/>',
  blood: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/><path d="M9 15c1 2 4 2 5 0"/>',
  oracle: '<circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/><path d="M6 6l12 12"/>',
  locked: '<rect x="6" y="10" width="12" height="10"/><path d="M8 10V8a4 4 0 0 1 8 0v2"/>',
  cursed: '<path d="M12 3 3 20h18L12 3Z"/><path d="M12 9v4M12 17h.1"/>',
  burning: '<path d="M12 21c-4 0-7-3-7-7 0-4 4-6 5-10 2 2 2 5 5 7 1-1 2-3 1-5 4 4 4 15-4 15Z"/>',
  drained: '<path d="M12 21s-7-5-7-11a7 7 0 0 1 14 0c0 6-7 11-7 11Z"/><path d="M8 11h8"/>',
  empowered: '<path d="M12 2 4 13h7l-2 9 11-13h-7l-1-7Z"/>',
  gold: '<circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/>',
  energy: '<path d="M13 2 5 14h6l-1 8 9-13h-6l1-7Z"/>',
  hp: '<path d="M12 20s-8-5-8-11a4 4 0 0 1 7-3 4 4 0 0 1 7 3c0 6-6 9-6 11Z"/>'
};

const RELIC_ICONS: Record<string, IconId> = {
  silverAbacus: 'abacus',
  exactMirror: 'mirror',
  overkillAegis: 'shield',
  echoRune: 'echo',
  ashFour: 'ash',
  bossKey: 'key',
  merchantEye: 'eye',
  comboSigil: 'combo',
  heart128: 'heart',
  coinMagnet: 'coin',
  brokenMask: 'mask',
  prismSeed: 'prism',
  bloodEdge: 'blade',
  frozenCrown: 'crown',
  rouletteStone: 'roulette',
  moonLedger: 'book',
  forgeHammer: 'hammer',
  copperBell: 'bell',
  blackLotus: 'lotus',
  starAtlas: 'star',
  emberMandate: 'ember',
  eightGate: 'gate',
  firstSpark: 'spark',
  chainWard: 'combo',
  amberBulwark: 'shield',
  marketRune: 'coin',
  bossPact: 'key'
};

const SKILL_ICONS: Record<string, IconId> = {
  compress: 'compress',
  forge: 'forge',
  purge: 'purge',
  duplicate: 'duplicate',
  freeze: 'freeze',
  guard: 'shield',
  transmute: 'prism',
  execute: 'blade',
  rerollTarget: 'reroll',
  bloodMerge: 'blood',
  oraclePreview: 'oracle'
};

export function iconSvg(icon: IconId, label = ''): string {
  return `<svg class="game-icon" viewBox="0 0 24 24" aria-hidden="${label ? 'false' : 'true'}" role="img">
    ${label ? `<title>${label}</title>` : ''}
    <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter">${ICON_PATHS[icon]}</g>
  </svg>`;
}

const MEDALLION_SHARDS: Record<Rarity, string> = {
  common: '<path d="M5 19h2M17 5h2"/>',
  uncommon: '<path d="M4 17h3M17 7h3M12 3v2"/>',
  rare: '<path d="M4 12h3M17 12h3M12 3v3M12 18v3"/>',
  epic: '<path d="M4 7l2 2M18 7l-2 2M4 17l2-2M18 17l-2-2"/>',
  legendary: '<path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M19 5l-2 2"/>',
  mythic: '<path d="M12 1v4M12 19v4M1 12h4M19 12h4M4 4l3 3M20 4l-3 3M4 20l3-3M20 20l-3-3"/>'
};

export function relicIconSvg(relicId: string, label = '', rarity?: Rarity): string {
  const icon = RELIC_ICONS[relicId] ?? 'prism';
  const rarityClass = rarity ? ` rarity-${rarity}` : '';
  const shards = rarity ? MEDALLION_SHARDS[rarity] : MEDALLION_SHARDS.common;
  return `<svg class="game-icon relic-medallion${rarityClass}" viewBox="0 0 24 24" aria-hidden="${
    label ? 'false' : 'true'
  }" role="img">
    ${label ? `<title>${label}</title>` : ''}
    <path class="medallion-halo" d="M12 2 20 6v12l-8 4-8-4V6l8-4Z" />
    <path class="medallion-frame" d="M12 3 19 7v10l-7 4-7-4V7l7-4Z" />
    <path class="medallion-core" d="M12 6 16 8.5v7L12 18l-4-2.5v-7L12 6Z" />
    <g class="medallion-sigil" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="square" stroke-linejoin="miter">
      ${ICON_PATHS[icon]}
    </g>
    <g class="medallion-shards" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="square">${shards}</g>
  </svg>`;
}

export function skillIconSvg(skillId: string, label = ''): string {
  return iconSvg(SKILL_ICONS[skillId] ?? 'spark', label);
}

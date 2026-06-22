import type { EnemyDefinition } from '../types/enemy';

export const BOSSES: EnemyDefinition[] = [
  {
    id: 'bossAct1',
    name: 'El Dieciséis Coronado',
    rank: 'boss',
    act: 1,
    maxHp: 96,
    attackDamage: 12,
    attackEvery: 5,
    targets: [16, 32, 64],
    intent: 'Corona objetivos bajos.',
    ruleText: 'Cada 4 turnos bloquea una ficha. Los golpes exactos son clave.',
    behaviors: [
      { type: 'lockTile', every: 4, amount: 2 },
      { type: 'armor', amount: 2 }
    ],
    palette: { primary: 0xffd166, secondary: 0x2c2108, accent: 0xfff7cc }
  },
  {
    id: 'bossAct2',
    name: 'Oráculo Roto',
    rank: 'boss',
    act: 2,
    maxHp: 145,
    attackDamage: 15,
    attackEvery: 4,
    targets: [32, 64, 128],
    intent: 'Muta el objetivo.',
    ruleText: 'Cambia objetivo con frecuencia y ensucia apariciones.',
    behaviors: [
      { type: 'mirrorTarget', every: 2 },
      { type: 'poorSpawns' },
      { type: 'bossEntropy', every: 5 }
    ],
    palette: { primary: 0x38bdf8, secondary: 0x082f49, accent: 0xe0f2fe }
  },
  {
    id: 'bossAct3',
    name: 'Núcleo 2048',
    rank: 'boss',
    act: 3,
    maxHp: 210,
    attackDamage: 18,
    attackEvery: 4,
    targets: [64, 128, 128, 256],
    intent: 'Rompe el tablero.',
    ruleText: 'Maldice, bloquea y exige números altos. Vence para cerrar la run.',
    behaviors: [
      { type: 'lockTile', every: 3, amount: 2 },
      { type: 'curseValue', every: 3 },
      { type: 'bossEntropy', every: 4 },
      { type: 'armor', amount: 4 }
    ],
    palette: { primary: 0xff4d8d, secondary: 0x1b0a22, accent: 0xfef3c7 }
  }
];

export function getBossForAct(act: number): EnemyDefinition {
  return BOSSES[Math.max(0, Math.min(BOSSES.length - 1, act - 1))];
}

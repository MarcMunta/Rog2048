import type { EnemyDefinition } from '../types/enemy';

export const NORMAL_ENEMIES: EnemyDefinition[] = [
  {
    id: 'hollowClerk',
    name: 'Escriba Hueco',
    rank: 'normal',
    act: 1,
    maxHp: 30,
    attackDamage: 5,
    attackEvery: 5,
    targets: [8, 16, 16],
    intent: 'Ataca con tinta seca.',
    ruleText: 'Crea el objetivo o más para hacer daño fuerte.',
    behaviors: [{ type: 'basic' }],
    palette: { primary: 0x40f6d2, secondary: 0x10283a, accent: 0xffffff }
  },
  {
    id: 'rustRat',
    name: 'Rata de Cobre',
    rank: 'normal',
    act: 1,
    maxHp: 34,
    attackDamage: 6,
    attackEvery: 4,
    targets: [8, 16, 32],
    intent: 'Muerde si dudas.',
    ruleText: 'Si no aciertas objetivo, drena 1 vida extra.',
    behaviors: [{ type: 'drainOnDelay', amount: 1 }],
    palette: { primary: 0xffb347, secondary: 0x3a1d12, accent: 0xffe09c }
  },
  {
    id: 'numberImp',
    name: 'Diablillo Par',
    rank: 'normal',
    act: 1,
    maxHp: 36,
    attackDamage: 7,
    attackEvery: 5,
    targets: [16, 16, 32],
    intent: 'Exige exactitud.',
    ruleText: 'Solo los golpes exactos cuentan.',
    behaviors: [{ type: 'exactOnly' }],
    palette: { primary: 0xff4d8d, secondary: 0x31091c, accent: 0xffd1e3 }
  },
  {
    id: 'mirrorMouth',
    name: 'Boca Espejo',
    rank: 'normal',
    act: 1,
    maxHp: 38,
    attackDamage: 6,
    attackEvery: 5,
    targets: [8, 16, 32],
    intent: 'Cambia el pedido.',
    ruleText: 'Cada 3 turnos cambia el objetivo.',
    behaviors: [{ type: 'mirrorTarget', every: 3 }],
    palette: { primary: 0xb388ff, secondary: 0x1c1038, accent: 0xe9ddff }
  },
  {
    id: 'cellThief',
    name: 'Ladrón de Casillas',
    rank: 'normal',
    act: 2,
    maxHp: 54,
    attackDamage: 8,
    attackEvery: 4,
    targets: [16, 32, 32],
    intent: 'Bloquea una ficha.',
    ruleText: 'Cada 3 turnos bloquea una ficha por 2 turnos.',
    behaviors: [{ type: 'lockTile', every: 3, amount: 2 }],
    palette: { primary: 0x34d399, secondary: 0x10261d, accent: 0xd1fae5 }
  },
  {
    id: 'hexWeaver',
    name: 'Tejedora de Hex',
    rank: 'normal',
    act: 2,
    maxHp: 58,
    attackDamage: 8,
    attackEvery: 5,
    targets: [16, 32, 64],
    intent: 'Malice fichas pequeñas.',
    ruleText: 'Cada 4 turnos maldice una ficha; fusionarla duele más pero pesa.',
    behaviors: [{ type: 'curseValue', every: 4 }],
    palette: { primary: 0xa3e635, secondary: 0x1c260d, accent: 0xf7ffb8 }
  },
  {
    id: 'ironAccount',
    name: 'Cuenta Blindada',
    rank: 'normal',
    act: 2,
    maxHp: 62,
    attackDamage: 9,
    attackEvery: 5,
    targets: [32, 32, 64],
    intent: 'Reduce daño impreciso.',
    ruleText: 'Los golpes no exactos pierden 4 de daño.',
    behaviors: [{ type: 'armor', amount: 4 }],
    palette: { primary: 0x94a3b8, secondary: 0x141922, accent: 0xf8fafc }
  },
  {
    id: 'ashDealer',
    name: 'Tahúr de Ceniza',
    rank: 'normal',
    act: 2,
    maxHp: 60,
    attackDamage: 10,
    attackEvery: 4,
    targets: [16, 32, 64],
    intent: 'Ensucia las apariciones.',
    ruleText: 'Aparecen más doses mientras siga vivo.',
    behaviors: [{ type: 'poorSpawns' }],
    palette: { primary: 0xf97316, secondary: 0x2c1408, accent: 0xffedd5 }
  },
  {
    id: 'titheSpecter',
    name: 'Espectro del Diezmo',
    rank: 'normal',
    act: 3,
    maxHp: 82,
    attackDamage: 11,
    attackEvery: 4,
    targets: [32, 64, 64],
    intent: 'Cobra por combos pobres.',
    ruleText: 'Si haces menos de 2 fusiones, pierde 1 energía.',
    behaviors: [{ type: 'comboTax', amount: 1 }],
    palette: { primary: 0x22d3ee, secondary: 0x08242d, accent: 0xcffafe }
  },
  {
    id: 'graveCalculator',
    name: 'Calculadora Fúnebre',
    rank: 'normal',
    act: 3,
    maxHp: 88,
    attackDamage: 12,
    attackEvery: 5,
    targets: [32, 64, 128],
    intent: 'Cuenta regresiva brutal.',
    ruleText: 'Objetivos altos, ataques pesados.',
    behaviors: [{ type: 'basic' }],
    palette: { primary: 0xf43f5e, secondary: 0x2d0912, accent: 0xffccd5 }
  }
];

export const ELITE_ENEMIES: EnemyDefinition[] = [
  {
    id: 'lockjawPrime',
    name: 'Mandíbula Prisma',
    rank: 'elite',
    act: 2,
    maxHp: 92,
    attackDamage: 13,
    attackEvery: 4,
    targets: [32, 64, 64],
    intent: 'Bloquea y castiga.',
    ruleText: 'Bloquea fichas, reduce daño impreciso y golpea rápido.',
    behaviors: [
      { type: 'lockTile', every: 2, amount: 2 },
      { type: 'armor', amount: 3 }
    ],
    palette: { primary: 0xfacc15, secondary: 0x2c2305, accent: 0xfef9c3 }
  },
  {
    id: 'entropyNun',
    name: 'Monja de Entropía',
    rank: 'elite',
    act: 3,
    maxHp: 118,
    attackDamage: 15,
    attackEvery: 5,
    targets: [32, 64, 128],
    intent: 'Cambia reglas.',
    ruleText: 'Cambia objetivo, empeora apariciones y maldice fichas.',
    behaviors: [
      { type: 'mirrorTarget', every: 2 },
      { type: 'poorSpawns' },
      { type: 'curseValue', every: 3 }
    ],
    palette: { primary: 0xc084fc, secondary: 0x27113d, accent: 0xf3e8ff }
  }
];

export const ALL_ENEMIES = [...NORMAL_ENEMIES, ...ELITE_ENEMIES];

export function getEnemyById(id: string): EnemyDefinition {
  const enemy = ALL_ENEMIES.find((item) => item.id === id);
  if (!enemy) throw new Error(`Unknown enemy ${id}`);
  return enemy;
}

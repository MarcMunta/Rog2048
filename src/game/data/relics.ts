import type { RelicDefinition } from '../types/relic';

export const RELICS: RelicDefinition[] = [
  {
    id: 'silverAbacus',
    name: 'Ábaco de Plata',
    rarity: 'common',
    description: 'Las fusiones de 8 o menos dan +1 energía.',
    effect: 'lowMergeEnergy',
    value: 8
  },
  {
    id: 'exactMirror',
    name: 'Espejo Exacto',
    rarity: 'rare',
    description: 'Los golpes exactos hacen el doble de daño.',
    effect: 'exactDouble'
  },
  {
    id: 'overkillAegis',
    name: 'Égida del Exceso',
    rarity: 'uncommon',
    description: 'El daño sobrante al derrotar gana escudo.',
    effect: 'overkillShield'
  },
  {
    id: 'echoRune',
    name: 'Runa Eco',
    rarity: 'epic',
    description: 'La primera fusión de cada turno repite la mitad de su daño.',
    effect: 'echoFirstMerge'
  },
  {
    id: 'ashFour',
    name: 'Cuatro de Ceniza',
    rarity: 'epic',
    description: 'Los 4 pueden aparecer malditos. Fusionarlos añade daño.',
    effect: 'cursedFours'
  },
  {
    id: 'bossKey',
    name: 'Llave Menor',
    rarity: 'mythic',
    description: 'Los objetivos de jefes bajan un nivel.',
    effect: 'bossTargetDown'
  },
  {
    id: 'merchantEye',
    name: 'Ojo de Mercader',
    rarity: 'common',
    description: 'Las tiendas ofrecen un artículo extra.',
    effect: 'extraShopItem'
  },
  {
    id: 'comboSigil',
    name: 'Sigilo de Racha',
    rarity: 'uncommon',
    description: 'Con combo 3+, las habilidades cuestan 1 menos.',
    effect: 'comboSkillDiscount'
  },
  {
    id: 'heart128',
    name: 'Corazón 128',
    rarity: 'rare',
    description: 'Crear 128 cura 4 vida.',
    effect: 'healOn128',
    value: 4
  },
  {
    id: 'coinMagnet',
    name: 'Imán de Monedas',
    rarity: 'common',
    description: 'Cada golpe de objetivo gana 2 oro.',
    effect: 'goldOnTarget',
    value: 2
  },
  {
    id: 'brokenMask',
    name: 'Máscara Rota',
    rarity: 'uncommon',
    description: 'La penalización por bloqueo de tablero hace 2 menos y elimina una ficha.',
    effect: 'softNoMoves',
    value: 2
  },
  {
    id: 'prismSeed',
    name: 'Semilla Prisma',
    rarity: 'legendary',
    description: 'El primer golpe exacto de cada combate duplica una ficha baja.',
    effect: 'exactDuplicate'
  },
  {
    id: 'bloodEdge',
    name: 'Filo de Sangre',
    rarity: 'epic',
    description: 'Tras usar habilidad, el próximo golpe de objetivo suma 3 daño.',
    effect: 'bloodEdge',
    value: 3
  },
  {
    id: 'frozenCrown',
    name: 'Corona Helada',
    rarity: 'uncommon',
    description: 'Cada ficha que se desbloquea da 2 escudo.',
    effect: 'unlockShield',
    value: 2
  },
  {
    id: 'rouletteStone',
    name: 'Piedra Ruleta',
    rarity: 'rare',
    description: 'Cada 5 turnos cambia el objetivo y da +1 energía.',
    effect: 'turnRerollEnergy'
  },
  {
    id: 'moonLedger',
    name: 'Libro Lunar',
    rarity: 'uncommon',
    description: 'Los golpes exactos añaden +2 combo.',
    effect: 'exactCombo',
    value: 2
  },
  {
    id: 'forgeHammer',
    name: 'Martillo de Forja',
    rarity: 'common',
    description: 'Forjar mejora una ficha un nivel adicional.',
    effect: 'forgeBoost'
  },
  {
    id: 'copperBell',
    name: 'Campana de Cobre',
    rarity: 'rare',
    description: 'Crear 64 o más retrasa el ataque enemigo 1 turno.',
    effect: 'delayOnBigMerge'
  },
  {
    id: 'blackLotus',
    name: 'Loto Negro',
    rarity: 'mythic',
    description: 'Con 40% de vida o menos haces 50% más daño.',
    effect: 'lowHpDamage'
  },
  {
    id: 'starAtlas',
    name: 'Atlas Estelar',
    rarity: 'common',
    description: 'La vista previa favorece apariciones de 4 y 8.',
    effect: 'betterPreview'
  },
  {
    id: 'eightGate',
    name: 'Puerta del Ocho',
    rarity: 'epic',
    description: 'Cada tercera fusión que crea 8 genera un 16 extra.',
    effect: 'thirdEightCreates16'
  },
  {
    id: 'firstSpark',
    name: 'Primera Chispa',
    rarity: 'common',
    description: 'La primera ficha inicial de cada combate sube un nivel.',
    effect: 'firstSpawnUpgraded'
  },
  {
    id: 'emberMandate',
    name: 'Mandato de Brasa',
    rarity: 'legendary',
    description: 'Combo 4+ quema al enemigo durante 2 turnos.',
    effect: 'comboBurn'
  },
  {
    id: 'chainWard',
    name: 'Cadena de Guardia',
    rarity: 'uncommon',
    description: 'Con combo 4+ ganas 1 escudo al final del movimiento.',
    effect: 'comboShield',
    value: 1
  },
  {
    id: 'amberBulwark',
    name: 'Baluarte Ambar',
    rarity: 'rare',
    description: 'Guardia gana +3 escudo adicional.',
    effect: 'guardBoost',
    value: 3
  },
  {
    id: 'marketRune',
    name: 'Runa de Mercado',
    rarity: 'rare',
    description: 'Los precios de tienda bajan un 15%.',
    effect: 'shopDiscount',
    value: 15
  },
  {
    id: 'bossPact',
    name: 'Pacto del Jefe',
    rarity: 'legendary',
    description: 'Los golpes exactos contra jefes dan +1 energia, pero aceleran su ataque.',
    effect: 'bossExactEnergy',
    value: 1
  }
];

export function getRelicById(id: string): RelicDefinition {
  const relic = RELICS.find((item) => item.id === id);
  if (!relic) throw new Error(`Unknown relic ${id}`);
  return relic;
}

import type { SkillDefinition } from '../types/skill';

export const SKILLS: SkillDefinition[] = [
  {
    id: 'compress',
    name: 'Comprimir',
    rarity: 'common',
    description: 'Atrae todas las fichas hacia el centro sin fusionar.',
    cost: 2,
    cooldown: 2,
    targetMode: 'none',
    effect: 'compress'
  },
  {
    id: 'forge',
    name: 'Forjar',
    rarity: 'common',
    description: 'Sube una ficha al siguiente valor.',
    cost: 2,
    cooldown: 2,
    targetMode: 'tile',
    effect: 'forge'
  },
  {
    id: 'purge',
    name: 'Purgar',
    rarity: 'common',
    description: 'Elimina una ficha del tablero.',
    cost: 2,
    cooldown: 3,
    targetMode: 'tile',
    effect: 'purge'
  },
  {
    id: 'duplicate',
    name: 'Duplicar',
    rarity: 'uncommon',
    description: 'Copia una ficha de 32 o menos en una casilla libre.',
    cost: 3,
    cooldown: 3,
    targetMode: 'tile',
    effect: 'duplicate'
  },
  {
    id: 'freeze',
    name: 'Congelar',
    rarity: 'uncommon',
    description: 'Bloquea una ficha 2 turnos para usarla como ancla.',
    cost: 1,
    cooldown: 2,
    targetMode: 'tile',
    effect: 'freeze'
  },
  {
    id: 'rerollTarget',
    name: 'Recalcular',
    rarity: 'common',
    description: 'Cambia el objetivo enemigo y gana 1 energía.',
    cost: 1,
    cooldown: 2,
    targetMode: 'none',
    effect: 'rerollTarget'
  },
  {
    id: 'bloodMerge',
    name: 'Fusión Sangrienta',
    rarity: 'epic',
    description: 'Paga 3 vida para fusionar un par igual en cualquier lugar.',
    cost: 0,
    cooldown: 4,
    targetMode: 'none',
    effect: 'bloodMerge'
  },
  {
    id: 'oraclePreview',
    name: 'Vista Oracular',
    rarity: 'mythic',
    description: 'Fija las próximas apariciones como 8, 4 y 4.',
    cost: 2,
    cooldown: 4,
    targetMode: 'none',
    effect: 'oraclePreview'
  }
];

export function getSkillById(id: string): SkillDefinition {
  const skill = SKILLS.find((item) => item.id === id);
  if (!skill) throw new Error(`Unknown skill ${id}`);
  return skill;
}

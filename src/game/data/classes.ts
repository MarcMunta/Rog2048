import type { PlayerClassDefinition } from '../types/run';

export const PLAYER_CLASSES: PlayerClassDefinition[] = [
  {
    id: 'accountant',
    name: 'El Contable',
    subtitle: 'Control exacto',
    description: 'Manipula objetivos, premia golpes exactos y convierte turnos limpios en ventaja.',
    maxHp: 48,
    maxEnergy: 5,
    startGold: 22,
    startingRelics: ['silverAbacus'],
    startingSkills: ['rerollTarget', 'purge'],
    palette: '#40f6d2'
  },
  {
    id: 'forger',
    name: 'La Forjadora',
    subtitle: 'Valor bruto',
    description: 'Sube fichas, comprime el tablero y fabrica números grandes antes de que el enemigo ataque.',
    maxHp: 54,
    maxEnergy: 4,
    startGold: 18,
    startingRelics: ['forgeHammer'],
    startingSkills: ['forge', 'compress'],
    palette: '#ffb347'
  },
  {
    id: 'heretic',
    name: 'El Hereje',
    subtitle: 'Riesgo sangriento',
    description: 'Paga vida para forzar fusiones y convierte estar herido en daño explosivo.',
    maxHp: 44,
    maxEnergy: 4,
    startGold: 26,
    startingRelics: ['blackLotus'],
    startingSkills: ['bloodMerge', 'duplicate'],
    palette: '#ff4d8d'
  },
  {
    id: 'oracle',
    name: 'La Oráculo',
    subtitle: 'Futuros mejores',
    description: 'Controla próximas apariciones, congela amenazas y reduce la varianza del tablero.',
    maxHp: 46,
    maxEnergy: 5,
    startGold: 20,
    startingRelics: ['starAtlas'],
    startingSkills: ['oraclePreview', 'freeze'],
    palette: '#b388ff'
  }
];

export function getClassById(id: string): PlayerClassDefinition {
  const definition = PLAYER_CLASSES.find((item) => item.id === id);
  if (!definition) throw new Error(`Unknown class ${id}`);
  return definition;
}

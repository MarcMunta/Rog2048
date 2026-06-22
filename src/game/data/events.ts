import type { RunState } from '../types/run';
import { clamp } from '../utils/random';

export interface EventChoiceDefinition {
  id: string;
  label: string;
  description: string;
  apply: (run: RunState) => string;
}

export interface EventDefinition {
  id: string;
  name: string;
  body: string;
  choices: EventChoiceDefinition[];
}

export const EVENTS: EventDefinition[] = [
  {
    id: 'silentVault',
    name: 'Bóveda Silenciosa',
    body: 'Una caja sin cerradura late con números impares.',
    choices: [
      {
        id: 'takeGold',
        label: 'Abrir con cuidado',
        description: 'Gana 18 oro.',
        apply: (run) => {
          run.player.gold += 18;
          return 'La bóveda paga en monedas frías.';
        }
      },
      {
        id: 'bleedForRelic',
        label: 'Abrir con sangre',
        description: 'Pierde 6 vida. Gana un talismán raro en la próxima recompensa.',
        apply: (run) => {
          run.player.hp = clamp(run.player.hp - 6, 1, run.player.maxHp);
          run.flags.forceRareRelic = (run.flags.forceRareRelic ?? 0) + 1;
          return 'La bóveda recuerda tu nombre.';
        }
      }
    ]
  },
  {
    id: 'tileShrine',
    name: 'Santuario de Fichas',
    body: 'Cuatro runas giran como un tablero vacío.',
    choices: [
      {
        id: 'maxHp',
        label: 'Grabar vitalidad',
        description: '+5 vida máxima. Cura 5.',
        apply: (run) => {
          run.player.maxHp += 5;
          run.player.hp = clamp(run.player.hp + 5, 0, run.player.maxHp);
          return 'Tu pulso aprende un patrón nuevo.';
        }
      },
      {
        id: 'energy',
        label: 'Grabar chispa',
        description: '+1 energía máxima para esta run.',
        apply: (run) => {
          run.player.maxEnergy += 1;
          return 'La chispa queda bajo tu lengua.';
        }
      }
    ]
  },
  {
    id: 'debtorGhost',
    name: 'Fantasma Deudor',
    body: 'Un espectro ofrece pagar una deuda que no recuerdas.',
    choices: [
      {
        id: 'accept',
        label: 'Aceptar pago',
        description: 'Gana 25 oro. El próximo combate empieza con -1 energía.',
        apply: (run) => {
          run.player.gold += 25;
          run.flags.nextCombatEnergyPenalty = (run.flags.nextCombatEnergyPenalty ?? 0) + 1;
          return 'El oro pesa demasiado.';
        }
      },
      {
        id: 'refuse',
        label: 'Romper recibo',
        description: 'Cura 8.',
        apply: (run) => {
          run.player.hp = clamp(run.player.hp + 8, 0, run.player.maxHp);
          return 'El recibo arde sin humo.';
        }
      }
    ]
  },
  {
    id: 'blackMarket',
    name: 'Mercado Negro',
    body: 'Un puesto vende reglas escritas en hueso.',
    choices: [
      {
        id: 'cheapSkill',
        label: 'Comprar truco',
        description: 'Paga 18 oro. La próxima habilidad cuesta 1 menos.',
        apply: (run) => {
          if (run.player.gold < 18) return 'No tienes oro suficiente.';
          run.player.gold -= 18;
          run.flags.nextSkillDiscount = (run.flags.nextSkillDiscount ?? 0) + 1;
          return 'El truco cabe en una uña.';
        }
      },
      {
        id: 'leave',
        label: 'Pasar de largo',
        description: 'Nada ocurre.',
        apply: () => 'Nadie te sigue. Casi seguro.'
      }
    ]
  },
  {
    id: 'mirrorWell',
    name: 'Pozo Espejo',
    body: 'Ves un tablero donde tus peores fichas sonríen.',
    choices: [
      {
        id: 'study',
        label: 'Estudiar reflejo',
        description: 'Gana +1 combo inicial en próximos 2 combates.',
        apply: (run) => {
          run.flags.startingCombo = (run.flags.startingCombo ?? 0) + 2;
          return 'Aprendes a no mirar demasiado.';
        }
      },
      {
        id: 'drink',
        label: 'Beber del pozo',
        description: 'Pierde 4 vida. Gana 12 oro.',
        apply: (run) => {
          run.player.hp = clamp(run.player.hp - 4, 1, run.player.maxHp);
          run.player.gold += 12;
          return 'Sabe a moneda mojada.';
        }
      }
    ]
  },
  {
    id: 'burningIndex',
    name: 'Índice Ardiente',
    body: 'Un libro enumera todos los errores que aún no has cometido.',
    choices: [
      {
        id: 'read',
        label: 'Leer índice',
        description: 'El próximo objetivo enemigo baja un nivel.',
        apply: (run) => {
          run.flags.nextTargetDown = (run.flags.nextTargetDown ?? 0) + 1;
          return 'Una línea desaparece justo cuando la entiendes.';
        }
      },
      {
        id: 'sell',
        label: 'Vender páginas',
        description: 'Gana 16 oro.',
        apply: (run) => {
          run.player.gold += 16;
          return 'Las páginas chillan poco.';
        }
      }
    ]
  },
  {
    id: 'glassAnvil',
    name: 'Yunque de Vidrio',
    body: 'Puede mejorar una herramienta, si no se rompe antes.',
    choices: [
      {
        id: 'upgrade',
        label: 'Golpear suave',
        description: 'Mejora una habilidad aleatoria.',
        apply: (run) => {
          const skillId = run.skillIds[0];
          run.skillUpgrades[skillId] = (run.skillUpgrades[skillId] ?? 0) + 1;
          return 'El vidrio no se rompe. Tú casi sí.';
        }
      },
      {
        id: 'smash',
        label: 'Romper y saquear',
        description: 'Gana 20 oro. Pierde 5 vida.',
        apply: (run) => {
          run.player.gold += 20;
          run.player.hp = clamp(run.player.hp - 5, 1, run.player.maxHp);
          return 'El yunque grita en números primos.';
        }
      }
    ]
  },
  {
    id: 'quietCamp',
    name: 'Campamento Quieto',
    body: 'Por una vez, nada calcula tu muerte.',
    choices: [
      {
        id: 'rest',
        label: 'Dormir',
        description: 'Cura 12.',
        apply: (run) => {
          run.player.hp = clamp(run.player.hp + 12, 0, run.player.maxHp);
          return 'Sueñas con un tablero limpio.';
        }
      },
      {
        id: 'train',
        label: 'Entrenar',
        description: '+3 vida máxima.',
        apply: (run) => {
          run.player.maxHp += 3;
          run.player.hp += 3;
          return 'Despiertas con manos firmes.';
        }
      }
    ]
  }
];

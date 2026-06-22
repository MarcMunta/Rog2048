import type { Rarity } from '../types/common';

export type ShopItemType = 'relic' | 'skill' | 'heal' | 'maxHp' | 'upgrade';

export interface ShopItemDefinition {
  id: string;
  type: ShopItemType;
  title: string;
  description: string;
  price: number;
  rarity: Rarity;
  refId?: string;
  amount?: number;
}

export const SHOP_UPGRADES: ShopItemDefinition[] = [
  {
    id: 'healSmall',
    type: 'heal',
    title: 'Ungüento Numérico',
    description: 'Cura 10 vida.',
    price: 18,
    rarity: 'common',
    amount: 10
  },
  {
    id: 'healLarge',
    type: 'heal',
    title: 'Sutura de Neón',
    description: 'Cura 20 vida.',
    price: 32,
    rarity: 'rare',
    amount: 20
  },
  {
    id: 'maxHp',
    type: 'maxHp',
    title: 'Vaso de Mercurio',
    description: '+5 vida máxima.',
    price: 36,
    rarity: 'rare',
    amount: 5
  },
  {
    id: 'upgradeSkill',
    type: 'upgrade',
    title: 'Marca de Maestría',
    description: 'Mejora una habilidad equipada.',
    price: 30,
    rarity: 'common'
  },
  {
    id: 'relicExactMirror',
    type: 'relic',
    title: 'Espejo Exacto',
    description: 'Compra talismán: golpes exactos dobles.',
    price: 48,
    rarity: 'rare',
    refId: 'exactMirror'
  },
  {
    id: 'relicMerchantEye',
    type: 'relic',
    title: 'Ojo de Mercader',
    description: 'Compra talismán: tiendas con más opciones.',
    price: 28,
    rarity: 'common',
    refId: 'merchantEye'
  },
  {
    id: 'skillDuplicate',
    type: 'skill',
    title: 'Duplicar',
    description: 'Añade habilidad: copia fichas bajas.',
    price: 38,
    rarity: 'rare',
    refId: 'duplicate'
  },
  {
    id: 'skillOracle',
    type: 'skill',
    title: 'Vista Oracular',
    description: 'Añade habilidad: controla próximas apariciones.',
    price: 56,
    rarity: 'legendary',
    refId: 'oraclePreview'
  }
];

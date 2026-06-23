import { RELICS, getRelicById } from '../data/relics';
import { itemPrice } from '../data/rarities';
import { SHOP_UPGRADES, type ShopItemDefinition } from '../data/shops';
import { SKILLS, getSkillById } from '../data/skills';
import { RelicSystem } from './RelicSystem';
import type { RunState } from '../types/run';
import { Random, clamp } from '../utils/random';

export class EconomySystem {
  static offers(run: RunState): ShopItemDefinition[] {
    const count = 4 + RelicSystem.getShopOfferBonus(run);
    const rng = new Random(run.seed + run.floor * 733);
    const dynamic: ShopItemDefinition[] = [];

    const relics = rng.shuffle(RELICS.filter((relic) => !run.relicIds.includes(relic.id))).slice(0, 3);
    relics.forEach((relic) => {
      dynamic.push({
        id: `shop-relic-${relic.id}`,
        type: 'relic',
        title: relic.name,
        description: relic.description,
        price: itemPrice(relic.rarity, 'relic'),
        rarity: relic.rarity,
        refId: relic.id
      });
    });

    const skills = rng.shuffle(SKILLS.filter((skill) => !run.skillIds.includes(skill.id))).slice(0, 2);
    skills.forEach((skill) => {
      dynamic.push({
        id: `shop-skill-${skill.id}`,
        type: 'skill',
        title: skill.name,
        description: skill.description,
        price: itemPrice(skill.rarity, 'skill'),
        rarity: skill.rarity,
        refId: skill.id
      });
    });

    return rng.shuffle([...SHOP_UPGRADES, ...dynamic]).slice(0, count);
  }

  static purchase(run: RunState, item: ShopItemDefinition): { ok: boolean; message: string } {
    const flag = this.purchaseFlag(run, item.id);
    if (run.flags[flag]) return { ok: false, message: 'Ya comprado.' };
    if (run.player.gold < item.price) return { ok: false, message: 'Oro insuficiente.' };
    run.player.gold -= item.price;
    run.flags[flag] = 1;

    if (item.type === 'relic' && item.refId && !run.relicIds.includes(item.refId)) {
      run.relicIds.push(item.refId);
      return { ok: true, message: `${getRelicById(item.refId).name} obtenido.` };
    }
    if (item.type === 'skill' && item.refId && !run.skillIds.includes(item.refId)) {
      run.skillIds.push(item.refId);
      return { ok: true, message: `${getSkillById(item.refId).name} aprendida.` };
    }
    if (item.type === 'heal') {
      run.player.hp = clamp(run.player.hp + (item.amount ?? 0), 0, run.player.maxHp);
      return { ok: true, message: 'Vida restaurada.' };
    }
    if (item.type === 'maxHp') {
      run.player.maxHp += item.amount ?? 0;
      run.player.hp += item.amount ?? 0;
      return { ok: true, message: 'Vida máxima aumentada.' };
    }
    if (item.type === 'upgrade') {
      const skillId = run.skillIds[0];
      run.skillUpgrades[skillId] = (run.skillUpgrades[skillId] ?? 0) + 1;
      return { ok: true, message: `${getSkillById(skillId).name} mejorada.` };
    }
    return { ok: true, message: 'Comprado.' };
  }

  static purchaseFlag(run: RunState, itemId: string): string {
    return `shop:${run.currentNodeId ?? run.floor}:${itemId}`;
  }
}

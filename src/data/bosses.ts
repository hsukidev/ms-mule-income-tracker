import type { Boss, BossFamily } from '../types';

export const bosses: Boss[] = [
  { id: 'extreme-black-mage', name: 'Extreme Black Mage', family: 'black-mage', mesoValue: 18000000000 },
  { id: 'extreme-kaling', name: 'Extreme Kaling', family: 'kaling', mesoValue: 6026000000 },
  { id: 'extreme-first-adversary', name: 'Extreme First Adversary', family: 'first-adversary', mesoValue: 5880000000 },
  { id: 'extreme-kalos-the-guardian', name: 'Extreme Kalos the Guardian', family: 'kalos-the-guardian', mesoValue: 5200000000 },
  { id: 'hard-black-mage', name: 'Hard Black Mage', family: 'black-mage', mesoValue: 4500000000 },
  { id: 'extreme-chosen-seren', name: 'Extreme Chosen Seren', family: 'chosen-seren', mesoValue: 4235000000 },
  { id: 'hard-baldrix', name: 'Hard Baldrix', family: 'baldrix', mesoValue: 4200000000 },
  { id: 'hard-limbo', name: 'Hard Limbo', family: 'limbo', mesoValue: 3745000000 },
  { id: 'hard-kaling', name: 'Hard Kaling', family: 'kaling', mesoValue: 2990000000 },
  { id: 'hard-first-adversary', name: 'Hard First Adversary', family: 'first-adversary', mesoValue: 2940000000 },
  { id: 'normal-baldrix', name: 'Normal Baldrix', family: 'baldrix', mesoValue: 2800000000 },
  { id: 'chaos-kalos-the-guardian', name: 'Chaos Kalos the Guardian', family: 'kalos-the-guardian', mesoValue: 2600000000 },
  { id: 'normal-limbo', name: 'Normal Limbo', family: 'limbo', mesoValue: 2100000000 },
  { id: 'normal-kaling', name: 'Normal Kaling', family: 'kaling', mesoValue: 1506500000 },
  { id: 'extreme-lotus', name: 'Extreme Lotus', family: 'lotus', mesoValue: 1397500000 },
  { id: 'normal-first-adversary', name: 'Normal First Adversary', family: 'first-adversary', mesoValue: 1365000000 },
  { id: 'normal-kalos-the-guardian', name: 'Normal Kalos the Guardian', family: 'kalos-the-guardian', mesoValue: 1300000000 },
  { id: 'hard-chosen-seren', name: 'Hard Chosen Seren', family: 'chosen-seren', mesoValue: 1096562500 },
  { id: 'easy-kaling', name: 'Easy Kaling', family: 'kaling', mesoValue: 1031250000 },
  { id: 'easy-first-adversary', name: 'Easy First Adversary', family: 'first-adversary', mesoValue: 985000000 },
  { id: 'easy-kalos-the-guardian', name: 'Easy Kalos the Guardian', family: 'kalos-the-guardian', mesoValue: 937500000 },
  { id: 'normal-chosen-seren', name: 'Normal Chosen Seren', family: 'chosen-seren', mesoValue: 889021875 },
  { id: 'hard-verus-hilla', name: 'Hard Verus Hilla', family: 'verus-hilla', mesoValue: 762105000 },
  { id: 'hard-darknell', name: 'Hard Darknell', family: 'darknell', mesoValue: 667920000 },
  { id: 'hard-will', name: 'Hard Will', family: 'will', mesoValue: 621810000 },
  { id: 'chaos-guardian-angel-slime', name: 'Chaos Guardian Angel Slime', family: 'guardian-angel-slime', mesoValue: 600578125 },
  { id: 'normal-verus-hilla', name: 'Normal Verus Hilla', family: 'verus-hilla', mesoValue: 581880000 },
  { id: 'chaos-gloom', name: 'Chaos Gloom', family: 'gloom', mesoValue: 563945000 },
  { id: 'hard-lucid', name: 'Hard Lucid', family: 'lucid', mesoValue: 504000000 },
  { id: 'hard-lotus', name: 'Hard Lotus', family: 'lotus', mesoValue: 444675000 },
  { id: 'hard-damien', name: 'Hard Damien', family: 'damien', mesoValue: 421875000 },
  { id: 'normal-darknell', name: 'Normal Darknell', family: 'darknell', mesoValue: 316875000 },
  { id: 'normal-gloom', name: 'Normal Gloom', family: 'gloom', mesoValue: 297675000 },
  { id: 'normal-will', name: 'Normal Will', family: 'will', mesoValue: 279075000 },
  { id: 'normal-lucid', name: 'Normal Lucid', family: 'lucid', mesoValue: 253828125 },
  { id: 'easy-will', name: 'Easy Will', family: 'will', mesoValue: 246744750 },
  { id: 'easy-lucid', name: 'Easy Lucid', family: 'lucid', mesoValue: 237009375 },
  { id: 'normal-guardian-angel-slime', name: 'Normal Guardian Angel Slime', family: 'guardian-angel-slime', mesoValue: 231673500 },
  { id: 'normal-damien', name: 'Normal Damien', family: 'damien', mesoValue: 169000000 },
  { id: 'normal-lotus', name: 'Normal Lotus', family: 'lotus', mesoValue: 162562500 },
  { id: 'akechi-mitsuhide', name: 'Akechi Mitsuhide', family: 'akechi-mitsuhide', mesoValue: 144000000 },
  { id: 'chaos-papulatus', name: 'Chaos Papulatus', family: 'papulatus', mesoValue: 132250000 },
  { id: 'chaos-vellum', name: 'Chaos Vellum', family: 'vellum', mesoValue: 105062500 },
  { id: 'hard-magnus', name: 'Hard Magnus', family: 'magnus', mesoValue: 95062500 },
  { id: 'princess-no', name: 'Princess No', family: 'princess-no', mesoValue: 81000000 },
  { id: 'chaos-zakum', name: 'Chaos Zakum', family: 'zakum', mesoValue: 81000000 },
  { id: 'chaos-pierre', name: 'Chaos Pierre', family: 'pierre', mesoValue: 81000000 },
  { id: 'chaos-von-bon', name: 'Chaos Von Bon', family: 'von-bon', mesoValue: 81000000 },
  { id: 'chaos-crimson-queen', name: 'Chaos Crimson Queen', family: 'crimson-queen', mesoValue: 81000000 },
  { id: 'normal-cygnus', name: 'Normal Cygnus', family: 'cygnus', mesoValue: 72250000 },
  { id: 'chaos-pink-bean', name: 'Chaos Pink Bean', family: 'pink-bean', mesoValue: 64000000 },
  { id: 'hard-hilla', name: 'Hard Hilla', family: 'hilla', mesoValue: 56250000 },
  { id: 'easy-cygnus', name: 'Easy Cygnus', family: 'cygnus', mesoValue: 45562500 },
  { id: 'hard-mori-ranmaru', name: 'Hard Mori Ranmaru', family: 'mori-ranmaru', mesoValue: 13322500 },
  { id: 'normal-papulatus', name: 'Normal Papulatus', family: 'papulatus', mesoValue: 13322500 },
  { id: 'normal-magnus', name: 'Normal Magnus', family: 'magnus', mesoValue: 12960000 },
  { id: 'normal-arkarium', name: 'Normal Arkarium', family: 'arkarium', mesoValue: 12602500 },
  { id: 'hard-von-leon', name: 'Hard Von Leon', family: 'von-leon', mesoValue: 12250000 },
  { id: 'normal-von-leon', name: 'Normal Von Leon', family: 'von-leon', mesoValue: 7290000 },
  { id: 'normal-pink-bean', name: 'Normal Pink Bean', family: 'pink-bean', mesoValue: 7022500 },
  { id: 'chaos-horntail', name: 'Chaos Horntail', family: 'horntail', mesoValue: 6760000 },
  { id: 'omni-cln', name: 'OMNI-CLN', family: 'omni-cln', mesoValue: 6250000 },
  { id: 'easy-arkarium', name: 'Easy Arkarium', family: 'arkarium', mesoValue: 5760000 },
  { id: 'easy-von-leon', name: 'Easy Von Leon', family: 'von-leon', mesoValue: 5290000 },
  { id: 'normal-horntail', name: 'Normal Horntail', family: 'horntail', mesoValue: 5062500 },
  { id: 'normal-pierre', name: 'Normal Pierre', family: 'pierre', mesoValue: 4840000 },
  { id: 'normal-von-bon', name: 'Normal Von Bon', family: 'von-bon', mesoValue: 4840000 },
  { id: 'normal-crimson-queen', name: 'Normal Crimson Queen', family: 'crimson-queen', mesoValue: 4840000 },
  { id: 'normal-vellum', name: 'Normal Vellum', family: 'vellum', mesoValue: 4840000 },
  { id: 'easy-horntail', name: 'Easy Horntail', family: 'horntail', mesoValue: 4410000 },
  { id: 'normal-mori-ranmaru', name: 'Normal Mori Ranmaru', family: 'mori-ranmaru', mesoValue: 4202500 },
  { id: 'normal-hilla', name: 'Normal Hilla', family: 'hilla', mesoValue: 4000000 },
  { id: 'easy-magnus', name: 'Easy Magnus', family: 'magnus', mesoValue: 3610000 },
  { id: 'easy-papulatus', name: 'Easy Papulatus', family: 'papulatus', mesoValue: 3422500 },
  { id: 'normal-zakum', name: 'Normal Zakum', family: 'zakum', mesoValue: 3062500 },
  { id: 'easy-zakum', name: 'Easy Zakum', family: 'zakum', mesoValue: 1000000 },
];

export const bossFamilies: BossFamily[] = (() => {
  const familyMap = new Map<string, Boss[]>();
  for (const boss of bosses) {
    if (!familyMap.has(boss.family)) {
      familyMap.set(boss.family, []);
    }
    familyMap.get(boss.family)!.push(boss);
  }
  return Array.from(familyMap.entries())
    .map(([family, familyBosses]) => ({
      family,
      bosses: familyBosses.sort((a, b) => b.mesoValue - a.mesoValue),
    }))
    .sort((a, b) => b.bosses[0].mesoValue - a.bosses[0].mesoValue);
})();

export function getBossById(id: string): Boss | undefined {
  return bosses.find((b) => b.id === id);
}

export function calculateMuleIncome(selectedBossIds: string[]): number {
  return selectedBossIds.reduce((sum, id) => {
    const boss = getBossById(id);
    return sum + (boss?.mesoValue ?? 0);
  }, 0);
}
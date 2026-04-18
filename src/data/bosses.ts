import type { Boss } from '../types';

/**
 * Matrix-variant Boss data.
 *
 * One row per family. Each row holds a stable hard-coded UUIDv4 `id`, a
 * display `name` with no difficulty prefix, a `contentType` (cadence for
 * the whole family), and a `difficulty[]` array of `{ tier, crystalValue }`.
 *
 * All families are seeded with `contentType: 'weekly'`; daily/monthly seed
 * data lands in a later slice.
 *
 * UUIDs were generated once via `uuid` (v13) and hard-coded here so ids
 * stay stable across reloads and test runs.
 */
export const bosses: Boss[] = [
  {
    id: 'a4d1238d-1519-4ea0-bada-16ed3520ddc7',
    name: 'Black Mage',
    family: 'black-mage',
    contentType: 'weekly',
    difficulty: [
      { tier: 'hard', crystalValue: 4500000000 },
      { tier: 'extreme', crystalValue: 18000000000 },
    ],
  },
  {
    id: '0fec4e62-1f8b-45e6-afb7-e137ca2056b3',
    name: 'Kaling',
    family: 'kaling',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 1031250000 },
      { tier: 'normal', crystalValue: 1506500000 },
      { tier: 'hard', crystalValue: 2990000000 },
      { tier: 'extreme', crystalValue: 6026000000 },
    ],
  },
  {
    id: 'b4d2a687-ddef-48fa-b6d0-e6873f11a239',
    name: 'First Adversary',
    family: 'first-adversary',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 985000000 },
      { tier: 'normal', crystalValue: 1365000000 },
      { tier: 'hard', crystalValue: 2940000000 },
      { tier: 'extreme', crystalValue: 5880000000 },
    ],
  },
  {
    id: '94ba4f12-f313-4d5b-bf93-f19221341d89',
    name: 'Kalos the Guardian',
    family: 'kalos-the-guardian',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 937500000 },
      { tier: 'normal', crystalValue: 1300000000 },
      { tier: 'chaos', crystalValue: 2600000000 },
      { tier: 'extreme', crystalValue: 5200000000 },
    ],
  },
  {
    id: '62e73832-cbae-471f-b5c7-dff68d2fe9d4',
    name: 'Chosen Seren',
    family: 'chosen-seren',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 889021875 },
      { tier: 'hard', crystalValue: 1096562500 },
      { tier: 'extreme', crystalValue: 4235000000 },
    ],
  },
  {
    id: 'e657dc8d-e2ba-414c-9c6e-51c1ed2ba23c',
    name: 'Baldrix',
    family: 'baldrix',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 2800000000 },
      { tier: 'hard', crystalValue: 4200000000 },
    ],
  },
  {
    id: 'd8c9fbda-6887-49e2-bd32-63e08adc62b6',
    name: 'Limbo',
    family: 'limbo',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 2100000000 },
      { tier: 'hard', crystalValue: 3745000000 },
    ],
  },
  {
    id: 'b6326724-fa76-47ee-bb62-748da7d5c9b6',
    name: 'Lotus',
    family: 'lotus',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 162562500 },
      { tier: 'hard', crystalValue: 444675000 },
      { tier: 'extreme', crystalValue: 1397500000 },
    ],
  },
  {
    id: '5de57685-48b5-44d4-83b9-4b30e2a5a715',
    name: 'Verus Hilla',
    family: 'verus-hilla',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 581880000 },
      { tier: 'hard', crystalValue: 762105000 },
    ],
  },
  {
    id: 'fb06eeef-20b7-4313-869b-0fa3086df4ef',
    name: 'Darknell',
    family: 'darknell',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 316875000 },
      { tier: 'hard', crystalValue: 667920000 },
    ],
  },
  {
    id: '8922d071-a02a-47ea-80d1-e685bac48bc9',
    name: 'Will',
    family: 'will',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 246744750 },
      { tier: 'normal', crystalValue: 279075000 },
      { tier: 'hard', crystalValue: 621810000 },
    ],
  },
  {
    id: 'b76be02b-ecab-4ea2-a407-5ae87c0e0509',
    name: 'Guardian Angel Slime',
    family: 'guardian-angel-slime',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 231673500 },
      { tier: 'chaos', crystalValue: 600578125 },
    ],
  },
  {
    id: '94fcece9-7b85-4114-ae34-40c7ce3ff7e5',
    name: 'Gloom',
    family: 'gloom',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 297675000 },
      { tier: 'chaos', crystalValue: 563945000 },
    ],
  },
  {
    id: '3a2e966c-7f0a-4b7d-b577-bb87f2350462',
    name: 'Lucid',
    family: 'lucid',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 237009375 },
      { tier: 'normal', crystalValue: 253828125 },
      { tier: 'hard', crystalValue: 504000000 },
    ],
  },
  {
    id: 'ed7b68c0-5047-4472-b9f3-3ee64214199d',
    name: 'Damien',
    family: 'damien',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 169000000 },
      { tier: 'hard', crystalValue: 421875000 },
    ],
  },
  {
    id: '8004e8a0-b748-42f7-81f9-72635aabb9dd',
    name: 'Akechi Mitsuhide',
    family: 'akechi-mitsuhide',
    contentType: 'weekly',
    difficulty: [{ tier: 'normal', crystalValue: 144000000 }],
  },
  {
    id: '12f43424-b32f-4874-903f-e253b65026f5',
    name: 'Papulatus',
    family: 'papulatus',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 3422500 },
      { tier: 'normal', crystalValue: 13322500 },
      { tier: 'chaos', crystalValue: 132250000 },
    ],
  },
  {
    id: '8a474f62-4613-4173-8ade-5f01f99eed75',
    name: 'Vellum',
    family: 'vellum',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 4840000 },
      { tier: 'chaos', crystalValue: 105062500 },
    ],
  },
  {
    id: 'c6acc7a0-8c65-4d69-9eaa-b891bcc44bd6',
    name: 'Magnus',
    family: 'magnus',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 3610000 },
      { tier: 'normal', crystalValue: 12960000 },
      { tier: 'hard', crystalValue: 95062500 },
    ],
  },
  {
    id: '722b4793-d736-4951-8c2f-a281c1e702d1',
    name: 'Princess No',
    family: 'princess-no',
    contentType: 'weekly',
    difficulty: [{ tier: 'normal', crystalValue: 81000000 }],
  },
  {
    id: '03efcbe1-d6e2-4b48-90ff-337fc6a644ba',
    name: 'Zakum',
    family: 'zakum',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 1000000 },
      { tier: 'normal', crystalValue: 3062500 },
      { tier: 'chaos', crystalValue: 81000000 },
    ],
  },
  {
    id: '04a0dda1-b211-41d7-ad51-d035ffca37a6',
    name: 'Pierre',
    family: 'pierre',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 4840000 },
      { tier: 'chaos', crystalValue: 81000000 },
    ],
  },
  {
    id: 'd873a55b-a3d0-4d95-8571-01233653a2e6',
    name: 'Von Bon',
    family: 'von-bon',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 4840000 },
      { tier: 'chaos', crystalValue: 81000000 },
    ],
  },
  {
    id: '795dd16f-c1e7-418b-8276-831b0389a5a0',
    name: 'Crimson Queen',
    family: 'crimson-queen',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 4840000 },
      { tier: 'chaos', crystalValue: 81000000 },
    ],
  },
  {
    id: 'df0c8986-1540-4d0c-a71c-3a8d187d68e1',
    name: 'Cygnus',
    family: 'cygnus',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 45562500 },
      { tier: 'normal', crystalValue: 72250000 },
    ],
  },
  {
    id: '572f2a96-5562-4128-aee5-918ef853f7ab',
    name: 'Pink Bean',
    family: 'pink-bean',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 7022500 },
      { tier: 'chaos', crystalValue: 64000000 },
    ],
  },
  {
    id: 'ece87e2a-fd06-49ca-b6a2-5f243162ca31',
    name: 'Hilla',
    family: 'hilla',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 4000000 },
      { tier: 'hard', crystalValue: 56250000 },
    ],
  },
  {
    id: '2b739dbc-8949-4d53-853a-e1cde5921140',
    name: 'Mori Ranmaru',
    family: 'mori-ranmaru',
    contentType: 'weekly',
    difficulty: [
      { tier: 'normal', crystalValue: 4202500 },
      { tier: 'hard', crystalValue: 13322500 },
    ],
  },
  {
    id: '493c9f87-44a6-4e0f-9d46-10f340188079',
    name: 'Arkarium',
    family: 'arkarium',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 5760000 },
      { tier: 'normal', crystalValue: 12602500 },
    ],
  },
  {
    id: '4a97f9f0-26d0-45ab-842d-b24de5615905',
    name: 'Von Leon',
    family: 'von-leon',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 5290000 },
      { tier: 'normal', crystalValue: 7290000 },
      { tier: 'hard', crystalValue: 12250000 },
    ],
  },
  {
    id: 'e8c1129e-671f-4600-adb1-9548e66a17f9',
    name: 'Horntail',
    family: 'horntail',
    contentType: 'weekly',
    difficulty: [
      { tier: 'easy', crystalValue: 4410000 },
      { tier: 'normal', crystalValue: 5062500 },
      { tier: 'chaos', crystalValue: 6760000 },
    ],
  },
  {
    id: 'c91e5d28-1211-46c4-a4fc-4dd57e0d2801',
    name: 'OMNI-CLN',
    family: 'omni-cln',
    contentType: 'weekly',
    difficulty: [{ tier: 'normal', crystalValue: 6250000 }],
  },
];

export const ALL_BOSS_IDS: ReadonlySet<string> = new Set(bosses.map((b) => b.id));

/** Families whose pre-1A legacy id had no difficulty prefix. */
export const TIER_LESS_FAMILIES: ReadonlySet<string> = new Set([
  'akechi-mitsuhide',
  'omni-cln',
  'princess-no',
]);

const bossById = new Map<string, Boss>(bosses.map((b) => [b.id, b]));

export function getBossById(id: string): Boss | undefined {
  return bossById.get(id);
}

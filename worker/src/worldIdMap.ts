/**
 * World ID map — owns the bidirectional translation between the SPA's
 * `WorldId` strings and the upstream Nexon API's
 * `{ region, rebootIndex, worldID }` triple. Covers all six supported
 * worlds across two regions:
 *
 *   - NA Heroic    (Kronos, Hyperion)            rebootIndex=1
 *   - EU Heroic    (Solis)                       rebootIndex=1
 *   - NA Interactive (Bera, Scania)              rebootIndex=0
 *   - EU Interactive (Luna)                      rebootIndex=0
 *
 * The numeric `worldID`s below were derived empirically by querying
 *
 *   https://www.nexon.com/api/maplestory/no-auth/ranking/v2/<region>?type=overall
 *     &id=weekly&reboot_index=<0|1>&page_index=1&character_name=<known>
 *
 * for a known character on each world and recording the `worldID` field
 * the upstream returned. Tuple uniqueness is required only within
 * `(region, rebootIndex)` — the same numeric id may appear in a different
 * regional or reboot bucket. A typo here would silently misroute lookups,
 * so the round-trip + per-bucket uniqueness invariants are pinned in the
 * test file.
 */

export type Region = 'na' | 'eu';

export type HeroicWorldId = 'heroic-kronos' | 'heroic-hyperion' | 'heroic-solis';
export type InteractiveWorldId = 'interactive-bera' | 'interactive-scania' | 'interactive-luna';
export type SupportedWorldId = HeroicWorldId | InteractiveWorldId;

export interface UpstreamWorldKey {
  /** Nexon datacenter the world is hosted on. */
  region: Region;
  /** `0` for Interactive worlds, `1` for Heroic / Reboot worlds. */
  rebootIndex: 0 | 1;
  /** Upstream's numeric world identifier inside the chosen region+reboot bucket. */
  worldID: number;
}

const WORLD_MAP: Readonly<Record<SupportedWorldId, UpstreamWorldKey>> = {
  'heroic-kronos': { region: 'na', rebootIndex: 1, worldID: 45 },
  'heroic-hyperion': { region: 'na', rebootIndex: 1, worldID: 70 },
  'heroic-solis': { region: 'eu', rebootIndex: 1, worldID: 46 },
  'interactive-scania': { region: 'na', rebootIndex: 0, worldID: 19 },
  'interactive-bera': { region: 'na', rebootIndex: 0, worldID: 1 },
  'interactive-luna': { region: 'eu', rebootIndex: 0, worldID: 30 },
};

export const SUPPORTED_WORLD_IDS: readonly SupportedWorldId[] = Object.keys(
  WORLD_MAP,
) as SupportedWorldId[];

const SUPPORTED_WORLD_ID_SET: ReadonlySet<string> = new Set(SUPPORTED_WORLD_IDS);

export function isSupportedWorldId(value: unknown): value is SupportedWorldId {
  return typeof value === 'string' && SUPPORTED_WORLD_ID_SET.has(value);
}

export function toUpstreamKey(worldId: SupportedWorldId): UpstreamWorldKey {
  return WORLD_MAP[worldId];
}

export function fromUpstreamKey(
  region: Region,
  rebootIndex: number,
  worldID: number,
): SupportedWorldId | null {
  for (const id of SUPPORTED_WORLD_IDS) {
    const key = WORLD_MAP[id];
    if (key.region === region && key.rebootIndex === rebootIndex && key.worldID === worldID) {
      return id;
    }
  }
  return null;
}

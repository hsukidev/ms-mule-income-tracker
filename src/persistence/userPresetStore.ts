import type { UserPreset } from '../data/userPresets';
import type { StoragePort } from './muleStore';
import { defaultUserPresetStoragePort } from './userPresetStorage';

/**
 * `UserPresetStore` — persistence facade for the **User Preset Library**.
 * Mirrors `MuleStore` exactly: synchronous `load()` so initial React state
 * lands without a flash, debounced `save(presets)` (200ms coalesce), and
 * `flush()` for `pagehide` / `beforeunload`. Uses its own `StoragePort`
 * (separate `localStorage` key) so the **Storage Lineage** is independent
 * from the mule data.
 */
export interface UserPresetStore {
  load(): UserPreset[];
  save(presets: UserPreset[]): void;
  flush(): void;
}

/**
 * Schema version for the persisted **User Preset** root. Lives alongside
 * the array so future shape changes can be migrated through
 * `userPresetMigrate` without disturbing the **Mule Schema Lineage**.
 */
export const CURRENT_USER_PRESET_SCHEMA_VERSION = 1;

const STORAGE_DEBOUNCE_MS = 200;

interface PersistedUserPresetRoot {
  schemaVersion: number;
  userPresets: unknown[];
}

function isPersistedRoot(value: unknown): value is PersistedUserPresetRoot {
  if (typeof value !== 'object' || value === null) return false;
  const root = value as { schemaVersion?: unknown; userPresets?: unknown };
  return Array.isArray(root.userPresets) && typeof root.schemaVersion === 'number';
}

function validatePreset(raw: unknown): UserPreset | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string') return null;
  if (typeof obj.name !== 'string') return null;
  if (!Array.isArray(obj.slateKeys)) return null;
  const slateKeys: string[] = [];
  for (const k of obj.slateKeys) {
    if (typeof k === 'string') slateKeys.push(k);
  }
  // `partySizes` is optional on disk: legacy presets persisted before the
  // partySizes capture rule shipped have no field. Default to `{}` and let
  // `userPresetMatch`'s default-aware compare treat them as party-size-agnostic.
  const partySizes: Record<string, number> = {};
  if (typeof obj.partySizes === 'object' && obj.partySizes !== null) {
    for (const [family, value] of Object.entries(obj.partySizes as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6) {
        partySizes[family] = value;
      }
    }
  }
  return { id: obj.id, name: obj.name, slateKeys, partySizes };
}

/**
 * Pure migration entry — turn a raw persisted string (or `null`) into a
 * validated `UserPreset[]`. Corrupt JSON, unrecognised shape, or `null`
 * collapse to `[]` (a **Wipe**). Today the store is at schemaVersion 1;
 * future versions plug their upgrade in here.
 */
export function userPresetMigrate(raw: string | null): UserPreset[] {
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!isPersistedRoot(parsed)) return [];
  const validated = parsed.userPresets.map(validatePreset);
  return validated.filter((p): p is UserPreset => p !== null);
}

function serialize(presets: UserPreset[]): string {
  return JSON.stringify({
    schemaVersion: CURRENT_USER_PRESET_SCHEMA_VERSION,
    userPresets: presets,
  });
}

/**
 * Build a `UserPresetStore` bound to `port` (defaults to the **Default
 * User Preset Storage Port**). Each call produces an independent store
 * with its own closure-local `pending` + `timer` refs — no module-level
 * state — so tests can spin up many isolated stores in the same process.
 */
export function createUserPresetStore(
  port: StoragePort = defaultUserPresetStoragePort,
): UserPresetStore {
  let pending: UserPreset[] | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function drain(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    const snapshot = pending;
    pending = null;
    if (snapshot !== null) port.write(serialize(snapshot));
  }

  return {
    load(): UserPreset[] {
      return userPresetMigrate(port.read());
    },
    save(presets: UserPreset[]): void {
      pending = presets;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(drain, STORAGE_DEBOUNCE_MS);
    },
    flush: drain,
  };
}

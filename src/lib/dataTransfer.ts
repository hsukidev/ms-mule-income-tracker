/**
 * Pure-logic data-transfer module — owns export/import for the four
 * localStorage keys that constitute a YABI user's "data": the roster blob
 * (`maplestory-mule-tracker`), the selected world (`world`), the
 * changelog dismissal marker (`lastSeenChangelog`), and the User Preset
 * library (`maplestory-mule-tracker-user-presets`). Theme and density are
 * intentionally excluded; they are device-level preferences.
 *
 * This module is React-free so the four functions below are unit-testable
 * without rendering. The React caller in Settings → Data Management is
 * responsible for clipboard, page reload, and toasts; this module only
 * deals in strings, validated payloads, and an injected storage port.
 *
 * Envelope shape (compressed before display, decompressed before validation):
 *
 *     {
 *       "app": "yabi",
 *       "exportVersion": 2,
 *       "exportedAt": "<ISO timestamp>",
 *       "data": {
 *         "maplestory-mule-tracker":              "<raw localStorage string>",
 *         "world":                                "<raw localStorage string>",
 *         "lastSeenChangelog":                    "<raw localStorage string>",
 *         "maplestory-mule-tracker-user-presets": "<raw localStorage string>"
 *       }
 *     }
 *
 * Each blob inside `data` stays a string — schema versioning lives in the
 * receiving migrators (`muleMigrate.ts`, `userPresetMigrate` in
 * `userPresetStore.ts`). The envelope's `exportVersion` is independent
 * from those. Bumped on schema changes (e.g., new required key); v1
 * envelopes are rejected and users must re-export.
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { findWorld } from '../data/worlds';
import { USER_PRESET_STORAGE_KEY } from '../persistence/userPresetStorage';

const TRACKER_KEY = 'maplestory-mule-tracker';

/**
 * Current envelope schema version. Bumped when `TRACKED_KEYS` changes
 * shape; older envelopes are rejected at decode so the receiver never
 * lands in a partial-import state.
 */
export const CURRENT_EXPORT_VERSION = 2;

/**
 * Apply transaction key order is fixed and documented for debuggability.
 * The same order is used for snapshot, write, and rollback. All keys
 * are required — adding or removing a key requires bumping
 * `CURRENT_EXPORT_VERSION`.
 */
export const TRACKED_KEYS = [
  TRACKER_KEY,
  'world',
  'lastSeenChangelog',
  USER_PRESET_STORAGE_KEY,
] as const;

export type TrackedKey = (typeof TRACKED_KEYS)[number];

/**
 * Storage port for the apply transaction. Generalizes the shape of
 * `defaultStoragePort` in `muleStorage.ts` (which is single-key) to the
 * multi-key case, and adds `removeItem` so a key absent pre-import can be
 * rolled back to absence rather than restored as `''`.
 */
export interface DataTransferStoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const defaultPort: DataTransferStoragePort = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

export interface ExportEnvelope {
  app: 'yabi';
  exportVersion: 2;
  exportedAt: string;
  data: Record<TrackedKey, string>;
}

export type DecodeResult = { ok: true; payload: ExportEnvelope } | { ok: false };

export type ApplyResult = { ok: true } | { ok: false };

export interface WorldCount {
  worldLabel: string;
  count: number;
}

export interface SummaryResult {
  before: WorldCount[];
  after: WorldCount[];
}

/**
 * Reads every tracked localStorage key, builds the export envelope, and
 * returns its lz-string-compressed `encodeURIComponent`-safe form. A
 * key whose `getItem` returns `null` (never written on this device) is
 * folded into the envelope as the empty string so `data` always carries
 * every `TRACKED_KEYS` entry; validation on the receiving side requires
 * them all to be present.
 */
export function buildExport(): string {
  const data = {} as Record<TrackedKey, string>;
  for (const key of TRACKED_KEYS) {
    data[key] = localStorage.getItem(key) ?? '';
  }
  const envelope: ExportEnvelope = {
    app: 'yabi',
    exportVersion: CURRENT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  return compressToEncodedURIComponent(JSON.stringify(envelope));
}

/**
 * Decompress + JSON.parse + validate. Returns a tagged union; **no
 * exception escapes**, including from `decompressFromEncodedURIComponent`
 * (which returns `null` or `''` on garbage input) and from `JSON.parse`.
 */
export function decodeImport(code: string): DecodeResult {
  let parsed: unknown;
  try {
    const json = decompressFromEncodedURIComponent(code);
    if (!json) return { ok: false };
    parsed = JSON.parse(json);
  } catch {
    return { ok: false };
  }

  if (!isExportEnvelope(parsed)) return { ok: false };
  return { ok: true, payload: parsed };
}

function isExportEnvelope(value: unknown): value is ExportEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.app !== 'yabi') return false;
  if (v.exportVersion !== CURRENT_EXPORT_VERSION) return false;
  if (typeof v.exportedAt !== 'string') return false;
  if (typeof v.data !== 'object' || v.data === null) return false;
  const data = v.data as Record<string, unknown>;
  for (const key of TRACKED_KEYS) {
    if (typeof data[key] !== 'string') return false;
  }
  return true;
}

/**
 * Four-phase transactional write — snapshot → write → rollback-on-throw →
 * success. Returns `{ ok: true }` when every write lands; returns
 * `{ ok: false }` if any `setItem` throws mid-write, after rolling back
 * the keys that *did* land. A snapshot key whose pre-import value was
 * `null` rolls back via `removeItem`, not `setItem('')`.
 *
 * Does **not** call `window.location.reload()` — that stays in the React
 * caller so this function is synchronously testable.
 */
export function applyImport(
  payload: ExportEnvelope,
  port: DataTransferStoragePort = defaultPort,
): ApplyResult {
  const snapshot = {} as Record<TrackedKey, string | null>;
  for (const key of TRACKED_KEYS) {
    snapshot[key] = port.getItem(key);
  }

  const written: TrackedKey[] = [];
  for (const key of TRACKED_KEYS) {
    try {
      port.setItem(key, payload.data[key]);
      written.push(key);
    } catch {
      for (const writtenKey of written) {
        const snap = snapshot[writtenKey];
        if (snap === null) {
          port.removeItem(writtenKey);
        } else {
          port.setItem(writtenKey, snap);
        }
      }
      return { ok: false };
    }
  }

  return { ok: true };
}

/**
 * Produces before/after world-grouped mule counts for the confirm screen.
 * "Before" reads the current localStorage roster; "after" parses the
 * payload's mule blob. Each side is sorted alphabetically by world label
 * via `findWorld()`; unknown world ids fall back to the raw id string;
 * worlds with zero mules on a given side are omitted from that side.
 */
export function summarizeImport(payload: ExportEnvelope): SummaryResult {
  return {
    before: countByWorld(localStorage.getItem(TRACKER_KEY)),
    after: countByWorld(payload.data[TRACKER_KEY]),
  };
}

function countByWorld(blob: string | null): WorldCount[] {
  if (!blob) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(blob);
  } catch {
    return [];
  }
  if (typeof parsed !== 'object' || parsed === null) return [];
  const root = parsed as { mules?: unknown };
  if (!Array.isArray(root.mules)) return [];

  const counts = new Map<string, number>();
  for (const m of root.mules) {
    if (typeof m !== 'object' || m === null) continue;
    const worldId = (m as { worldId?: unknown }).worldId;
    if (typeof worldId !== 'string' || worldId.length === 0) continue;
    counts.set(worldId, (counts.get(worldId) ?? 0) + 1);
  }

  const list: WorldCount[] = [];
  for (const [worldId, count] of counts) {
    const label = findWorld(worldId)?.label ?? worldId;
    list.push({ worldLabel: label, count });
  }
  list.sort((a, b) => a.worldLabel.localeCompare(b.worldLabel));
  return list;
}

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Mule } from '../types';
import { validateBossSelection } from '../data/bossSelection';

const STORAGE_KEY = 'maplestory-mule-tracker';
const FALLBACK_KEY = 'maplestory-mule-tracker-fallback';
const CURRENT_SCHEMA_VERSION = 2;

const LEGACY_ID_PREFIX = /^(extreme|hard|chaos|normal|easy)-/;

/** A stored id looks legacy if it matches <tier>-<family> or lacks a colon entirely. */
function isLegacyId(id: string): boolean {
  return LEGACY_ID_PREFIX.test(id) || !id.includes(':');
}

function validateMule(raw: unknown, opts: { wipeLegacy: boolean }): Mule | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string') return null;
  if (typeof obj.name !== 'string') return null;
  if (typeof obj.level !== 'number') return null;
  if (typeof obj.muleClass !== 'string') return null;
  if (!Array.isArray(obj.selectedBosses)) return null;

  const rawSelected = obj.selectedBosses as string[];
  const hasLegacy = rawSelected.some(isLegacyId);
  const selectedBosses =
    opts.wipeLegacy && hasLegacy ? [] : validateBossSelection(rawSelected);

  const rawPartySizes =
    typeof obj.partySizes === 'object' && obj.partySizes !== null
      ? (obj.partySizes as Record<string, unknown>)
      : undefined;
  const partySizes: Record<string, number> = {};
  if (rawPartySizes && !(opts.wipeLegacy && hasLegacy)) {
    for (const [family, n] of Object.entries(rawPartySizes)) {
      if (typeof n === 'number' && Number.isFinite(n)) partySizes[family] = n;
    }
  }

  return {
    id: obj.id,
    name: obj.name,
    level: obj.level,
    muleClass: obj.muleClass,
    selectedBosses,
    partySizes,
  };
}

/** The persisted root shape after slice 1B. */
interface PersistedRoot {
  schemaVersion: number;
  mules: Mule[];
}

/**
 * Parse a persisted payload into { mules, wipeLegacy }. Accepts either the
 * legacy "top-level array" shape (triggers wipe-on-load) or the new
 * { schemaVersion, mules } envelope.
 */
function parsePayload(raw: string): { mules: unknown[]; wipeLegacy: boolean } | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Pre-1B shape — root is bare array; always migrate.
      return { mules: parsed, wipeLegacy: true };
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const root = parsed as Partial<PersistedRoot>;
      if (Array.isArray(root.mules)) {
        const wipeLegacy = root.schemaVersion !== CURRENT_SCHEMA_VERSION;
        return { mules: root.mules, wipeLegacy };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function useMules() {
  const saveMules = useCallback((mules: Mule[]): void => {
    const root: PersistedRoot = { schemaVersion: CURRENT_SCHEMA_VERSION, mules };
    const serialized = JSON.stringify(root);
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      try {
        sessionStorage.setItem(FALLBACK_KEY, serialized);
      } catch {
        // Both storages failed; data persists in React state only
      }
    }
  }, []);

  function loadMules(): Mule[] {
    try {
      let data = localStorage.getItem(STORAGE_KEY);
      if (data === null) {
        data = sessionStorage.getItem(FALLBACK_KEY);
      }
      if (data === null) return [];
      const payload = parsePayload(data);
      if (!payload) return [];
      const validated = payload.mules.map((m) =>
        validateMule(m, { wipeLegacy: payload.wipeLegacy }),
      );
      return validated.filter((m): m is Mule => m !== null);
    } catch {
      return [];
    }
  }

  const [mules, setMules] = useState<Mule[]>(loadMules);

  useEffect(() => {
    saveMules(mules);
  }, [mules, saveMules]);

  const addMule = useCallback(() => {
    const newMule: Mule = {
      id: uuidv4(),
      name: '',
      level: 0,
      muleClass: '',
      selectedBosses: [],
      partySizes: {},
    };
    setMules((prev) => [newMule, ...prev]);
    return newMule.id;
  }, []);

  const updateMule = useCallback(
    (id: string, updates: Partial<Omit<Mule, 'id'>>) => {
      setMules((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const merged = { ...m, ...updates };
          if (updates.selectedBosses) {
            merged.selectedBosses = validateBossSelection(updates.selectedBosses);
          }
          return merged;
        }),
      );
    },
    [],
  );

  const deleteMule = useCallback((id: string) => {
    setMules((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const reorderMules = useCallback((oldIndex: number, newIndex: number) => {
    setMules((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, removed);
      return result;
    });
  }, []);

  return { mules, addMule, updateMule, deleteMule, reorderMules };
}

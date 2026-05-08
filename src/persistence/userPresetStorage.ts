import type { StoragePort } from './muleStore';

/**
 * **Default User Preset Storage Port** — the **User Preset Library's**
 * binding of the generic `StoragePort` interface to `window.localStorage`
 * (primary) and `window.sessionStorage` (fallback). Mirrors the mule
 * port's **Storage Fallback Ladder** but writes under a separate key
 * (`USER_PRESET_STORAGE_KEY`) so the user preset library has its own
 * independent **Storage Lineage**.
 */

export const USER_PRESET_STORAGE_KEY = 'maplestory-mule-tracker-user-presets';
const FALLBACK_KEY = 'maplestory-mule-tracker-user-presets-fallback';

export const defaultUserPresetStoragePort: StoragePort = {
  read(): string | null {
    try {
      const data = localStorage.getItem(USER_PRESET_STORAGE_KEY);
      if (data !== null) return data;
    } catch {
      // fall through to sessionStorage
    }
    try {
      return sessionStorage.getItem(FALLBACK_KEY);
    } catch {
      return null;
    }
  },
  write(data: string): void {
    try {
      localStorage.setItem(USER_PRESET_STORAGE_KEY, data);
      return;
    } catch {
      // fall through to sessionStorage
    }
    try {
      sessionStorage.setItem(FALLBACK_KEY, data);
    } catch {
      // Both storages failed; data persists in React state only.
    }
  },
};

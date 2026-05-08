import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createUserPresetStore,
  CURRENT_USER_PRESET_SCHEMA_VERSION,
  userPresetMigrate,
} from '../userPresetStore';
import { defaultUserPresetStoragePort, USER_PRESET_STORAGE_KEY } from '../userPresetStorage';
import type { StoragePort } from '../muleStore';
import type { UserPreset } from '../../data/userPresets';

function makeFakePort(initial: string | null = null): StoragePort & { writes: string[] } {
  let current: string | null = initial;
  const writes: string[] = [];
  return {
    read(): string | null {
      return current;
    },
    write(data: string): void {
      writes.push(data);
      current = data;
    },
    writes,
  };
}

function presetFixture(overrides: Partial<UserPreset> = {}): UserPreset {
  return {
    id: 'p1',
    name: 'My Preset',
    slateKeys: ['k1', 'k2'],
    ...overrides,
  };
}

describe('createUserPresetStore', () => {
  describe('load()', () => {
    it('returns [] when the port yields null', () => {
      const port = makeFakePort(null);
      expect(createUserPresetStore(port).load()).toEqual([]);
    });

    it('returns [] on corrupt JSON', () => {
      const port = makeFakePort('not json');
      expect(createUserPresetStore(port).load()).toEqual([]);
    });

    it('round-trips a persisted payload', () => {
      const presets = [presetFixture(), presetFixture({ id: 'p2', name: 'Other', slateKeys: [] })];
      const payload = JSON.stringify({
        schemaVersion: CURRENT_USER_PRESET_SCHEMA_VERSION,
        userPresets: presets,
      });
      const port = makeFakePort(payload);
      const store = createUserPresetStore(port);
      expect(store.load()).toEqual(presets);
    });

    it('drops malformed presets but keeps valid ones', () => {
      const payload = JSON.stringify({
        schemaVersion: CURRENT_USER_PRESET_SCHEMA_VERSION,
        userPresets: [
          presetFixture(),
          { id: 'bad', name: 'no keys' }, // missing slateKeys
          { id: 42, name: 'wrong id type', slateKeys: [] },
          presetFixture({ id: 'p2' }),
        ],
      });
      const port = makeFakePort(payload);
      const store = createUserPresetStore(port);
      const loaded = store.load();
      expect(loaded.map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('returns [] when payload lacks schemaVersion (a Wipe)', () => {
      const port = makeFakePort(JSON.stringify({ userPresets: [presetFixture()] }));
      expect(createUserPresetStore(port).load()).toEqual([]);
    });

    it('matches userPresetMigrate(port.read()) exactly', () => {
      const payload = JSON.stringify({
        schemaVersion: CURRENT_USER_PRESET_SCHEMA_VERSION,
        userPresets: [presetFixture()],
      });
      const port = makeFakePort(payload);
      expect(createUserPresetStore(port).load()).toEqual(userPresetMigrate(payload));
    });
  });

  describe('save() — debounced writes', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not write synchronously', () => {
      const port = makeFakePort();
      const store = createUserPresetStore(port);
      store.save([presetFixture()]);
      expect(port.writes).toHaveLength(0);
    });

    it('coalesces a burst into a single write after 200ms', () => {
      const port = makeFakePort();
      const store = createUserPresetStore(port);
      store.save([presetFixture({ name: 'a' })]);
      store.save([presetFixture({ name: 'b' })]);
      store.save([presetFixture({ name: 'c' })]);
      vi.advanceTimersByTime(200);
      expect(port.writes).toHaveLength(1);
      const saved = JSON.parse(port.writes[0]);
      expect(saved.userPresets[0].name).toBe('c');
    });

    it('serializes as { schemaVersion, userPresets }', () => {
      const port = makeFakePort();
      const store = createUserPresetStore(port);
      const presets = [presetFixture()];
      store.save(presets);
      vi.advanceTimersByTime(200);
      const saved = JSON.parse(port.writes[0]);
      expect(saved.schemaVersion).toBe(CURRENT_USER_PRESET_SCHEMA_VERSION);
      expect(saved.userPresets).toEqual(presets);
    });

    it('starts a fresh debounce after the previous one flushes', () => {
      const port = makeFakePort();
      const store = createUserPresetStore(port);
      store.save([presetFixture({ name: 'first' })]);
      vi.advanceTimersByTime(200);
      expect(port.writes).toHaveLength(1);
      store.save([presetFixture({ name: 'second' })]);
      vi.advanceTimersByTime(200);
      expect(port.writes).toHaveLength(2);
      expect(JSON.parse(port.writes[1]).userPresets[0].name).toBe('second');
    });
  });

  describe('flush()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('writes pending state immediately without waiting for the timer', () => {
      const port = makeFakePort();
      const store = createUserPresetStore(port);
      store.save([presetFixture({ name: 'urgent' })]);
      store.flush();
      expect(port.writes).toHaveLength(1);
    });

    it('cancels the pending timer so no second write fires later', () => {
      const port = makeFakePort();
      const store = createUserPresetStore(port);
      store.save([presetFixture()]);
      store.flush();
      vi.advanceTimersByTime(1000);
      expect(port.writes).toHaveLength(1);
    });

    it('is a no-op when nothing is pending', () => {
      const port = makeFakePort();
      const store = createUserPresetStore(port);
      store.flush();
      expect(port.writes).toHaveLength(0);
    });
  });

  describe('default port (no argument)', () => {
    let localStorageStore: Record<string, string> = {};

    beforeEach(() => {
      vi.useFakeTimers();
      localStorageStore = {};
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageStore[key] = value;
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(() => null),
      });
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(() => null),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('writes to its own storage key (not the mule key)', () => {
      const store = createUserPresetStore();
      store.save([presetFixture()]);
      vi.advanceTimersByTime(200);
      expect(localStorageStore[USER_PRESET_STORAGE_KEY]).toBeDefined();
      expect(localStorageStore['maplestory-mule-tracker']).toBeUndefined();
    });
  });
});

describe('defaultUserPresetStoragePort', () => {
  let localStorageStore: Record<string, string> = {};
  let sessionStorageStore: Record<string, string> = {};

  beforeEach(() => {
    localStorageStore = {};
    sessionStorageStore = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageStore[key] = value;
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => sessionStorageStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        sessionStorageStore[key] = value;
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('write() falls through to sessionStorage when localStorage.setItem throws', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });
    defaultUserPresetStoragePort.write('payload');
    expect(sessionStorageStore['maplestory-mule-tracker-user-presets-fallback']).toBe('payload');
  });

  it('read() returns the localStorage value when present', () => {
    localStorageStore[USER_PRESET_STORAGE_KEY] = 'primary';
    expect(defaultUserPresetStoragePort.read()).toBe('primary');
  });

  it('read() falls through to sessionStorage when localStorage.getItem returns null', () => {
    sessionStorageStore['maplestory-mule-tracker-user-presets-fallback'] = 'fallback';
    expect(defaultUserPresetStoragePort.read()).toBe('fallback');
  });
});

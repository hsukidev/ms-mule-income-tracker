import { describe, expect, it, vi } from 'vitest';
import { handleLookup, type HandlerDeps } from '../worker';
import type { NexonRankEntry } from '../nexonAdapter';

/**
 * Boundary tests for the Worker handler. The handler is exported with an
 * optional `HandlerDeps` parameter so the adapter and cache can be stubbed
 * in tests without spinning up Miniflare or hitting the live Nexon API.
 *
 * The orchestration the handler owns: input validation, cache check,
 * adapter call, world-ID filtering, response reshape, cache write. The
 * adapter contract itself is covered exhaustively in nexonAdapter.test.ts.
 */

function get(path: string, headers?: HeadersInit): Request {
  return new Request(`http://example.com${path}`, headers ? { headers } : undefined);
}

function rankEntry(overrides: Partial<NexonRankEntry> = {}): NexonRankEntry {
  return {
    rank: 1,
    characterName: 'Alice',
    characterImgURL: 'https://msavatar1.nexon.net/Character/Alice.png',
    jobID: 232,
    jobName: 'Bishop',
    level: 286,
    exp: 1000,
    gap: 0,
    worldID: 45,
    startRank: 1,
    ...overrides,
  };
}

interface StubCache {
  match: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  store: Map<string, Response>;
}

function inMemoryCache(): StubCache {
  const store = new Map<string, Response>();
  const match = vi.fn(async (req: Request | string) => {
    const key = typeof req === 'string' ? req : req.url;
    const cached = store.get(key);
    return cached ? cached.clone() : undefined;
  });
  const put = vi.fn(async (req: Request | string, res: Response) => {
    const key = typeof req === 'string' ? req : req.url;
    store.set(key, res.clone());
  });
  return { match, put, store };
}

function deps(overrides: Partial<HandlerDeps> = {}): HandlerDeps {
  return {
    cache: inMemoryCache() as unknown as Cache,
    fetchByName: vi.fn(async () => []),
    ...overrides,
  };
}

describe('worker handler — proxy-auth gate', () => {
  it('returns 404 when proxySecret is configured but the header is missing', async () => {
    const adapter = vi.fn(async () => []);
    const res = await handleLookup(
      get('/api/character/Alice?worldId=heroic-kronos'),
      deps({ fetchByName: adapter, proxySecret: 'expected' }),
    );
    expect(res.status).toBe(404);
    expect(adapter).not.toHaveBeenCalled();
  });

  it('returns 404 when proxySecret is configured but the header does not match', async () => {
    const adapter = vi.fn(async () => []);
    const res = await handleLookup(
      get('/api/character/Alice?worldId=heroic-kronos', { 'x-proxy-auth': 'wrong' }),
      deps({ fetchByName: adapter, proxySecret: 'expected' }),
    );
    expect(res.status).toBe(404);
    expect(adapter).not.toHaveBeenCalled();
  });

  it('passes through to validation when the header matches the secret', async () => {
    const adapter = vi.fn(async () => [rankEntry({ worldID: 45 })]);
    const res = await handleLookup(
      get('/api/character/Alice?worldId=heroic-kronos', { 'x-proxy-auth': 'expected' }),
      deps({ fetchByName: adapter, proxySecret: 'expected' }),
    );
    expect(res.status).toBe(200);
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('skips the gate entirely when proxySecret is undefined (existing tests rely on this)', async () => {
    const adapter = vi.fn(async () => [rankEntry({ worldID: 45 })]);
    const res = await handleLookup(
      get('/api/character/Alice?worldId=heroic-kronos'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(200);
  });
});

describe('worker handler — input validation', () => {
  it('returns 400 for a missing worldId', async () => {
    const res = await handleLookup(get('/api/character/Alice'), deps());
    expect(res.status).toBe(400);
  });

  it('returns 400 for an unknown worldId', async () => {
    const res = await handleLookup(get('/api/character/Alice?worldId=unknown-world'), deps());
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-character route', async () => {
    const res = await handleLookup(get('/api/something-else'), deps());
    expect(res.status).toBe(404);
  });

  it('returns 400 for a name with non-alphanumeric chars (rejects before Nexon)', async () => {
    const adapter = vi.fn(async () => []);
    const res = await handleLookup(
      get('/api/character/Alice!?worldId=heroic-kronos'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(400);
    expect(adapter).not.toHaveBeenCalled();
  });

  it('returns 400 for a name shorter than 2 chars', async () => {
    const adapter = vi.fn(async () => []);
    const res = await handleLookup(
      get('/api/character/A?worldId=heroic-kronos'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(400);
    expect(adapter).not.toHaveBeenCalled();
  });

  it('returns 400 for a name longer than 13 chars', async () => {
    const adapter = vi.fn(async () => []);
    const res = await handleLookup(
      get('/api/character/AliceTheVeryLongName?worldId=heroic-kronos'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(400);
    expect(adapter).not.toHaveBeenCalled();
  });

  it('caches 400 invalid-name responses with a ~1 hour Cache-Control max-age', async () => {
    const cache = inMemoryCache();
    const adapter = vi.fn(async () => []);
    await handleLookup(get('/api/character/Alice!?worldId=heroic-kronos'), {
      cache: cache as unknown as Cache,
      fetchByName: adapter,
    });
    expect(cache.put).toHaveBeenCalledTimes(1);
    const cachedResponse = cache.put.mock.calls[0][1] as Response;
    expect(cachedResponse.status).toBe(400);
    const cc = cachedResponse.headers.get('cache-control') ?? '';
    expect(cc).toMatch(/max-age=3600/);
  });
});

describe('worker handler — adapter orchestration', () => {
  it('calls the adapter with region+rebootIndex from the world ID map (na/1 for Heroic Kronos)', async () => {
    const adapter = vi.fn(async () => [rankEntry()]);
    await handleLookup(
      get('/api/character/Alice?worldId=heroic-kronos'),
      deps({ fetchByName: adapter }),
    );
    expect(adapter).toHaveBeenCalledWith('Alice', 'na', 1);
  });

  it('calls the adapter with na/0 for an Interactive NA world (Bera)', async () => {
    const adapter = vi.fn(async () => [rankEntry({ worldID: 1 })]);
    await handleLookup(
      get('/api/character/Alice?worldId=interactive-bera'),
      deps({ fetchByName: adapter }),
    );
    expect(adapter).toHaveBeenCalledWith('Alice', 'na', 0);
  });

  it('calls the adapter with eu/1 for an EU Heroic world (Solis)', async () => {
    const adapter = vi.fn(async () => [rankEntry({ worldID: 46 })]);
    await handleLookup(
      get('/api/character/Alice?worldId=heroic-solis'),
      deps({ fetchByName: adapter }),
    );
    expect(adapter).toHaveBeenCalledWith('Alice', 'eu', 1);
  });

  it('calls the adapter with eu/0 for an EU Interactive world (Luna)', async () => {
    const adapter = vi.fn(async () => [rankEntry({ worldID: 30 })]);
    await handleLookup(
      get('/api/character/Alice?worldId=interactive-luna'),
      deps({ fetchByName: adapter }),
    );
    expect(adapter).toHaveBeenCalledWith('Alice', 'eu', 0);
  });

  it('reshapes a matching Interactive-world rank into the documented response contract', async () => {
    // Interactive-bera lives at rebootIndex=0, worldID=1 in the map.
    const adapter = vi.fn(async () => [
      rankEntry({
        characterName: 'Bobby',
        worldID: 1,
        level: 250,
        jobName: 'Hero',
        characterImgURL: 'https://msavatar1.nexon.net/Character/Bobby.png',
      }),
    ]);
    const res = await handleLookup(
      get('/api/character/Bobby?worldId=interactive-bera'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.name).toBe('Bobby');
    expect(body.level).toBe(250);
    expect(body.className).toBe('Hero');
    expect(body.worldId).toBe('interactive-bera');
  });

  it('disambiguates by numeric worldID for an Interactive NA world (picks Scania over Bera)', async () => {
    // NA Interactive bucket: bera=1, scania=19. Adapter returns ranks for both;
    // a request for `interactive-scania` must pick the worldID=19 entry.
    const adapter = vi.fn(async () => [
      rankEntry({ worldID: 1, level: 210, jobName: 'Bishop' }),
      rankEntry({ worldID: 19, level: 220, jobName: 'Night Lord' }),
    ]);
    const res = await handleLookup(
      get('/api/character/Echo?worldId=interactive-scania'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.level).toBe(220);
    expect(body.className).toBe('Night Lord');
    expect(body.worldId).toBe('interactive-scania');
  });

  it('reshapes a matching rank into the documented response contract', async () => {
    const adapter = vi.fn(async () => [
      rankEntry({
        characterName: 'Alice',
        worldID: 45,
        level: 286,
        jobName: 'Bishop',
        characterImgURL: 'https://msavatar1.nexon.net/Character/Alice.png',
      }),
    ]);
    const res = await handleLookup(
      get('/api/character/Alice?worldId=heroic-kronos'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.name).toBe('Alice');
    expect(body.level).toBe(286);
    expect(body.className).toBe('Bishop');
    expect(body.avatarUrl).toBe('https://msavatar1.nexon.net/Character/Alice.png');
    expect(body.worldId).toBe('heroic-kronos');
    expect(typeof body.fetchedAt).toBe('string');
  });

  it('filters by numeric worldID — picks the Hyperion rank when worldId=heroic-hyperion', async () => {
    // NA Heroic bucket: kronos=45, hyperion=70.
    const adapter = vi.fn(async () => [
      rankEntry({ worldID: 45, level: 285, jobName: 'Hero' }),
      rankEntry({ worldID: 70, level: 280, jobName: 'Bishop' }),
    ]);
    const res = await handleLookup(
      get('/api/character/Echo?worldId=heroic-hyperion'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.level).toBe(280);
    expect(body.className).toBe('Bishop');
    expect(body.worldId).toBe('heroic-hyperion');
  });

  it('returns 404 when no rank matches the expected numeric worldID', async () => {
    const adapter = vi.fn(async () => [rankEntry({ worldID: 70 }), rankEntry({ worldID: 71 })]);
    const res = await handleLookup(
      get('/api/character/Echo?worldId=heroic-kronos'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when the adapter returns an empty rank list', async () => {
    const adapter = vi.fn(async () => []);
    const res = await handleLookup(
      get('/api/character/Nobody?worldId=heroic-kronos'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 502 when the adapter throws', async () => {
    const adapter = vi.fn(async () => {
      throw new Error('upstream went sideways');
    });
    const res = await handleLookup(
      get('/api/character/Alice?worldId=heroic-kronos'),
      deps({ fetchByName: adapter }),
    );
    expect(res.status).toBe(502);
  });
});

describe('worker handler — cache', () => {
  it('serves a cached response without calling the adapter on a hit', async () => {
    const cache = inMemoryCache();
    const adapter = vi.fn(async () => [rankEntry({ worldID: 45 })]);

    // First call populates the cache.
    await handleLookup(get('/api/character/Alice?worldId=heroic-kronos'), {
      cache: cache as unknown as Cache,
      fetchByName: adapter,
    });
    expect(adapter).toHaveBeenCalledTimes(1);

    // Second call should be a cache hit — adapter not called again.
    const res = await handleLookup(get('/api/character/Alice?worldId=heroic-kronos'), {
      cache: cache as unknown as Cache,
      fetchByName: adapter,
    });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('writes successful responses with a ~6 hour Cache-Control max-age', async () => {
    const cache = inMemoryCache();
    const adapter = vi.fn(async () => [rankEntry({ worldID: 45 })]);
    await handleLookup(get('/api/character/Alice?worldId=heroic-kronos'), {
      cache: cache as unknown as Cache,
      fetchByName: adapter,
    });
    expect(cache.put).toHaveBeenCalledTimes(1);
    const cachedResponse = cache.put.mock.calls[0][1] as Response;
    const cc = cachedResponse.headers.get('cache-control') ?? '';
    expect(cc).toMatch(/max-age=21600/);
  });

  it('writes 404 responses with a ~1 hour Cache-Control max-age', async () => {
    const cache = inMemoryCache();
    const adapter = vi.fn(async () => []);
    await handleLookup(get('/api/character/Nobody?worldId=heroic-kronos'), {
      cache: cache as unknown as Cache,
      fetchByName: adapter,
    });
    expect(cache.put).toHaveBeenCalledTimes(1);
    const cachedResponse = cache.put.mock.calls[0][1] as Response;
    expect(cachedResponse.status).toBe(404);
    const cc = cachedResponse.headers.get('cache-control') ?? '';
    expect(cc).toMatch(/max-age=3600/);
  });

  it('does not write to the cache for upstream failures (502)', async () => {
    const cache = inMemoryCache();
    const adapter = vi.fn(async () => {
      throw new Error('upstream broken');
    });
    await handleLookup(get('/api/character/Alice?worldId=heroic-kronos'), {
      cache: cache as unknown as Cache,
      fetchByName: adapter,
    });
    expect(cache.put).not.toHaveBeenCalled();
  });

  it('keys the cache on (name, worldId) — different worlds do not collide', async () => {
    const cache = inMemoryCache();
    const adapter = vi.fn(async () => [
      rankEntry({ worldID: 45, level: 200 }),
      rankEntry({ worldID: 70, level: 100 }),
    ]);

    const kronos = await handleLookup(get('/api/character/Alice?worldId=heroic-kronos'), {
      cache: cache as unknown as Cache,
      fetchByName: adapter,
    });
    const hyperion = await handleLookup(get('/api/character/Alice?worldId=heroic-hyperion'), {
      cache: cache as unknown as Cache,
      fetchByName: adapter,
    });

    expect(((await kronos.json()) as { level: number }).level).toBe(200);
    expect(((await hyperion.json()) as { level: number }).level).toBe(100);
    expect(cache.store.size).toBe(2);
  });
});

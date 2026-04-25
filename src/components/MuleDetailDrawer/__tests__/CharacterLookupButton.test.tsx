import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';

const sonnerMock = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('sonner', () => sonnerMock);

import { CharacterLookupButton } from '../CharacterLookupButton';
import { CHARACTER_LOOKUP_COPY } from '../characterLookupCopy';
import type { Mule } from '../../../types';

const ORIGINAL_FETCH = globalThis.fetch;

const baseMule: Mule = {
  id: 'm1',
  name: 'Alice',
  level: 200,
  muleClass: 'Hero',
  selectedBosses: [],
  active: true,
  worldId: 'heroic-kronos',
};

beforeEach(() => {
  globalThis.fetch = vi.fn() as unknown as typeof fetch;
  sonnerMock.toast.mockClear();
  sonnerMock.toast.success.mockClear();
  sonnerMock.toast.error.mockClear();
  sonnerMock.toast.info.mockClear();
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe('CharacterLookupButton — disabled rules', () => {
  it('disables when the draft name is empty', () => {
    render(<CharacterLookupButton mule={baseMule} draftName="" onUpdate={vi.fn()} />);
    const btn = screen.getByTestId('character-lookup-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('disables when the draft name is whitespace-only', () => {
    render(<CharacterLookupButton mule={baseMule} draftName="   " onUpdate={vi.fn()} />);
    const btn = screen.getByTestId('character-lookup-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('disables when the mule has no worldId', () => {
    const mule = { ...baseMule, worldId: undefined };
    render(<CharacterLookupButton mule={mule} draftName="Alice" onUpdate={vi.fn()} />);
    const btn = screen.getByTestId('character-lookup-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('enables when draft name is non-empty and a world is selected', () => {
    render(<CharacterLookupButton mule={baseMule} draftName="Alice" onUpdate={vi.fn()} />);
    const btn = screen.getByTestId('character-lookup-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});

describe('CharacterLookupButton — click behavior', () => {
  it('calls onUpdate with name/class/level/avatarUrl on success', async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            name: 'Alice',
            level: 250,
            className: 'Bishop',
            avatarUrl: 'https://msavatar1.nexon.net/Character/x.png',
            worldId: 'heroic-kronos',
            fetchedAt: 'now',
          }),
          { status: 200 },
        ),
    ) as unknown as typeof fetch;

    const onUpdate = vi.fn();
    render(<CharacterLookupButton mule={baseMule} draftName="Alice" onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId('character-lookup-button'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('m1', {
        name: 'Alice',
        level: 250,
        muleClass: 'Bishop',
        avatarUrl: 'https://msavatar1.nexon.net/Character/x.png',
      });
    });
  });

  it('does NOT call onUpdate when the lookup returns 404 (not-found)', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 404 }),
    ) as unknown as typeof fetch;
    const onUpdate = vi.fn();
    render(<CharacterLookupButton mule={baseMule} draftName="notfound" onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId('character-lookup-button'));
    await waitFor(() => {
      expect(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('does NOT call onUpdate when the lookup returns 502 (upstream-failed)', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 502 }),
    ) as unknown as typeof fetch;
    const onUpdate = vi.fn();
    render(<CharacterLookupButton mule={baseMule} draftName="Alice" onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId('character-lookup-button'));
    await waitFor(() => {
      expect(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('does NOT call onUpdate on a network failure', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('network failed');
    }) as unknown as typeof fetch;
    const onUpdate = vi.fn();
    render(<CharacterLookupButton mule={baseMule} draftName="Alice" onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId('character-lookup-button'));
    await waitFor(() => {
      expect(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('does NOT call onUpdate when the component unmounts mid-flight', async () => {
    let resolveFetch: (response: Response) => void = () => {};
    globalThis.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    ) as unknown as typeof fetch;
    const onUpdate = vi.fn();
    const { unmount } = render(
      <CharacterLookupButton mule={baseMule} draftName="Alice" onUpdate={onUpdate} />,
    );
    fireEvent.click(screen.getByTestId('character-lookup-button'));
    unmount();
    resolveFetch(
      new Response(
        JSON.stringify({
          name: 'Alice',
          level: 250,
          className: 'Bishop',
          avatarUrl: 'x',
          worldId: 'heroic-kronos',
          fetchedAt: 'now',
        }),
        { status: 200 },
      ),
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe('CharacterLookupButton — toast copy', () => {
  it('emits the not-found copy from the shared constants on a 404', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 404 }),
    ) as unknown as typeof fetch;
    render(<CharacterLookupButton mule={baseMule} draftName="notfound" onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTestId('character-lookup-button'));
    await waitFor(() => {
      expect(sonnerMock.toast.error).toHaveBeenCalledWith(
        CHARACTER_LOOKUP_COPY.notFound.title,
        expect.objectContaining({ description: CHARACTER_LOOKUP_COPY.notFound.description }),
      );
    });
  });

  it('emits the generic lookup-failed copy on a 502 (distinct from not-found)', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 502 }),
    ) as unknown as typeof fetch;
    render(<CharacterLookupButton mule={baseMule} draftName="Alice" onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTestId('character-lookup-button'));
    await waitFor(() => {
      expect(sonnerMock.toast.error).toHaveBeenCalledWith(
        CHARACTER_LOOKUP_COPY.lookupFailed.title,
        expect.objectContaining({ description: CHARACTER_LOOKUP_COPY.lookupFailed.description }),
      );
    });
  });

  it('emits the generic lookup-failed copy on a network error (distinct from not-found)', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('network failed');
    }) as unknown as typeof fetch;
    render(<CharacterLookupButton mule={baseMule} draftName="Alice" onUpdate={vi.fn()} />);
    fireEvent.click(screen.getByTestId('character-lookup-button'));
    await waitFor(() => {
      expect(sonnerMock.toast.error).toHaveBeenCalledWith(
        CHARACTER_LOOKUP_COPY.lookupFailed.title,
        expect.objectContaining({ description: CHARACTER_LOOKUP_COPY.lookupFailed.description }),
      );
    });
  });
});

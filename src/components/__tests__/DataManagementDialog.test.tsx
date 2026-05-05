import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { compressToEncodedURIComponent } from 'lz-string';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';

const sonnerMock = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
    getToasts: vi.fn(() => [] as Array<{ id: string | number }>),
  }),
}));

vi.mock('sonner', () => sonnerMock);

import { DataManagementDialog } from '../DataManagementDialog';

const TRACKER_KEY = 'maplestory-mule-tracker';
const WORLD_KEY = 'world';
const CHANGELOG_KEY = 'lastSeenChangelog';

function makeValidCode(
  data: Partial<Record<typeof TRACKER_KEY | typeof WORLD_KEY | typeof CHANGELOG_KEY, string>> = {},
) {
  return compressToEncodedURIComponent(
    JSON.stringify({
      app: 'yabi',
      exportVersion: 1,
      exportedAt: '2026-05-04T00:00:00.000Z',
      data: {
        [TRACKER_KEY]: data[TRACKER_KEY] ?? '',
        [WORLD_KEY]: data[WORLD_KEY] ?? '',
        [CHANGELOG_KEY]: data[CHANGELOG_KEY] ?? '',
      },
    }),
  );
}

function trackerBlob(mules: Array<{ id: string; worldId: string }>): string {
  return JSON.stringify({
    schemaVersion: 6,
    mules: mules.map((m) => ({
      id: m.id,
      name: m.id,
      level: 200,
      muleClass: 'Hero',
      selectedBosses: [],
      partySizes: {},
      active: true,
      worldId: m.worldId,
    })),
  });
}

describe('DataManagementDialog (chooser screen)', () => {
  it('does not render when closed', () => {
    render(<DataManagementDialog open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText('Data Management')).toBeNull();
  });

  it('renders the chooser title and both option rows when open', async () => {
    render(<DataManagementDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Data Management')).toBeTruthy();
    });
    expect(screen.getByText('Export Data')).toBeTruthy();
    expect(screen.getByText('Generate user data transfer code')).toBeTruthy();
    expect(screen.getByText('Import Data')).toBeTruthy();
    expect(screen.getByText('Paste user data transfer code')).toBeTruthy();
  });

  it('clicking Export advances internal state (chooser content goes away)', async () => {
    render(<DataManagementDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Export Data/ }));
    await waitFor(() => {
      expect(screen.queryByText('Generate user data transfer code')).toBeNull();
    });
  });

  it('clicking Import advances internal state (chooser content goes away)', async () => {
    render(<DataManagementDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Import Data')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/ }));
    await waitFor(() => {
      expect(screen.queryByText('Paste user data transfer code')).toBeNull();
    });
  });

  it('Escape closes the dialog (calls onOpenChange with false)', async () => {
    const onOpenChange = vi.fn();
    render(<DataManagementDialog open={true} onOpenChange={onOpenChange} />);
    await waitFor(() => {
      expect(screen.getByText('Data Management')).toBeTruthy();
    });
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
      code: 'Escape',
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe('DataManagementDialog (import paste screen)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  async function openImport() {
    render(<DataManagementDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Import Data')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/ }));
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });
  }

  it('shows a textarea, Cancel, and Import after clicking Import on chooser', async () => {
    await openImport();
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import' })).toBeTruthy();
  });

  it('Cancel returns to chooser', async () => {
    await openImport();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.getByText('Generate user data transfer code')).toBeTruthy();
    });
  });

  it('shows inline error and preserves pasted text on invalid code', async () => {
    await openImport();
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'not a real code' } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid YABI transfer code')).toBeTruthy();
    });
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('not a real code');
  });

  it('advances to the confirm screen on a valid code', async () => {
    await openImport();
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: makeValidCode() } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await waitFor(() => {
      expect(screen.getByText('Replace your data?')).toBeTruthy();
    });
  });
});

describe('DataManagementDialog (confirm screen)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  async function openConfirmWith(code: string) {
    render(<DataManagementDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Import Data')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/ }));
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: code } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await waitFor(() => {
      expect(screen.getByText('Replace your data?')).toBeTruthy();
    });
  }

  it('renders title and body copy', async () => {
    await openConfirmWith(makeValidCode());
    expect(screen.getByText('Replace your data?')).toBeTruthy();
    expect(
      screen.getByText('Importing will replace all your current data. This cannot be undone.'),
    ).toBeTruthy();
  });

  it('renders Before and After section labels', async () => {
    await openConfirmWith(makeValidCode());
    expect(screen.getByText(/Before/)).toBeTruthy();
    expect(screen.getByText(/After/)).toBeTruthy();
  });

  it('renders the after summary alphabetical by world label, omitting zero-mule worlds', async () => {
    localStorage.setItem(
      TRACKER_KEY,
      trackerBlob([
        { id: 'a', worldId: 'heroic-solis' },
        { id: 'b', worldId: 'heroic-solis' },
        { id: 'c', worldId: 'heroic-kronos' },
      ]),
    );
    const code = makeValidCode({
      [TRACKER_KEY]: trackerBlob([
        { id: 'x', worldId: 'interactive-luna' },
        { id: 'y', worldId: 'heroic-hyperion' },
        { id: 'z', worldId: 'heroic-hyperion' },
      ]),
    });
    await openConfirmWith(code);
    expect(screen.getByText(/Solis/)).toBeTruthy();
    expect(screen.getByText(/Kronos/)).toBeTruthy();
    expect(screen.getByText(/Hyperion/)).toBeTruthy();
    expect(screen.getByText(/Luna/)).toBeTruthy();
    // Omit any world with zero mules — Bera/Scania never appear.
    expect(screen.queryByText(/Bera/)).toBeNull();
    expect(screen.queryByText(/Scania/)).toBeNull();
  });

  it('renders a Replace and reload button', async () => {
    await openConfirmWith(makeValidCode());
    expect(screen.getByRole('button', { name: 'Replace and reload' })).toBeTruthy();
  });

  it('Back returns to the paste screen with the pasted text preserved', async () => {
    const code = makeValidCode();
    await openConfirmWith(code);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Import' })).toBeTruthy();
    });
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(code);
  });
});

describe('DataManagementDialog (Replace and reload)', () => {
  let reloadSpy: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    sonnerMock.toast.error.mockClear();
    sonnerMock.toast.getToasts.mockReturnValue([]);
    reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...originalLocation, reload: reloadSpy },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  async function openConfirmWith(code: string) {
    render(<DataManagementDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Import Data')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/ }));
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeTruthy();
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: code } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await waitFor(() => {
      expect(screen.getByText('Replace your data?')).toBeTruthy();
    });
  }

  it('writes imported data to localStorage and reloads on success', async () => {
    await openConfirmWith(makeValidCode({ [WORLD_KEY]: 'heroic-kronos' }));

    fireEvent.click(screen.getByRole('button', { name: 'Replace and reload' }));

    expect(localStorage.getItem(WORLD_KEY)).toBe('heroic-kronos');
    expect(reloadSpy).toHaveBeenCalledTimes(1);
    expect(sonnerMock.toast.error).not.toHaveBeenCalled();
  });

  it('on apply failure: shows the error toast, does not reload, and stays on confirm screen', async () => {
    await openConfirmWith(makeValidCode());

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    try {
      fireEvent.click(screen.getByRole('button', { name: 'Replace and reload' }));
    } finally {
      setItemSpy.mockRestore();
    }

    expect(reloadSpy).not.toHaveBeenCalled();
    expect(sonnerMock.toast.error).toHaveBeenCalledTimes(1);
    expect(sonnerMock.toast.error).toHaveBeenCalledWith(
      'Import failed — your data was not changed.',
      undefined,
    );
    // Still on the confirm screen.
    expect(screen.getByText('Replace your data?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Replace and reload' })).toBeTruthy();
  });
});

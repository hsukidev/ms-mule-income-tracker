import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { renderApp, screen, waitFor } from '@/test/test-utils';
import { releases } from '@/data/changelog';

const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(`${iso}T00:00:00Z`));

describe('Changelog page', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    localStorage.setItem('world', 'heroic-kronos');
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  it('renders the H1, subtitle, and a card per release with date and bullets', async () => {
    await renderApp({ initialPath: '/changelog' });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /changelog/i })).toBeTruthy();
    });

    expect(
      screen.getByText('Stay up to date with the latest changes and improvements'),
    ).toBeTruthy();

    expect(releases.length).toBeGreaterThan(0);

    for (const release of releases) {
      expect(screen.getByText(longDate(release.date))).toBeTruthy();
      for (const change of release.changes) {
        expect(screen.getByText(change)).toBeTruthy();
      }
    }
  });

  it('sets the document title to "Changelog — YABI" while mounted', async () => {
    await renderApp({ initialPath: '/changelog' });
    await waitFor(() => {
      expect(document.title).toBe('Changelog — YABI');
    });
  });
});

import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, within, fireEvent } from '@/test/test-utils';
import { KpiCard } from '../KpiCard';
import type { Mule } from '../../types';
import { bosses } from '../../data/bosses';

function mockNarrowViewport(maxPx: number) {
  const mock = vi.fn().mockImplementation((query: string) => {
    const m = /max-width:\s*([\d.]+)px/.exec(query);
    const queryMaxPx = m ? Number(m[1]) : Infinity;
    return {
      matches: maxPx <= queryMaxPx,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mock,
  });
}

function restoreMatchMedia() {
  // Delete back to jsdom default (matchMedia missing → KpiCard's try/catch
  // returns false, which is the "wide" layout).
  // @ts-expect-error - we intentionally remove the property
  delete window.matchMedia;
}

const HARD_LUCID = `${bosses.find((b) => b.family === 'lucid')!.id}:hard:weekly`;

const mule: Mule = {
  id: 'm1',
  name: 'A',
  level: 200,
  muleClass: 'Hero',
  selectedBosses: [],
  active: true,
};

function activeStatValue(): string {
  const card = screen.getByTestId('income-card') as HTMLElement;
  const label = within(card).getByText('ACTIVE');
  return label.parentElement!.querySelectorAll('div')[1]!.textContent ?? '';
}

function bignumText(): string {
  return screen.getByRole('button', { name: /toggle abbreviated meso format/i }).textContent ?? '';
}

describe('KpiCard', () => {
  it('uses a fixed padding independent of density', () => {
    render(<KpiCard mules={[mule]} />);
    const card = screen.getByTestId('income-card') as HTMLElement;
    expect(card.style.padding).toBe('24px');
  });

  it('counts mules with active: true regardless of boss selection', () => {
    const mules: Mule[] = [
      { ...mule, id: 'a', active: true, selectedBosses: [] },
      { ...mule, id: 'b', active: true, selectedBosses: [] },
    ];
    render(<KpiCard mules={mules} />);
    expect(activeStatValue()).toBe('2');
  });

  it('does not toggle format when total income is zero', () => {
    const nonzeroMule: Mule = { ...mule, selectedBosses: [HARD_LUCID] };
    const { rerender } = render(<KpiCard mules={[nonzeroMule]} />);
    // Abbreviated by default → "504M"
    expect(bignumText()).toBe('504M');
    rerender(<KpiCard mules={[{ ...mule, selectedBosses: [] }]} />);
    // formatMeso(0, true) renders as "0"; format preference unchanged.
    expect(bignumText()).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: /toggle abbreviated meso format/i }));
    // Still "0" — the onClick guard stops the toggle when raw===0.
    expect(bignumText()).toBe('0');
  });

  it('shows 0 when total income is zero from mount', () => {
    render(<KpiCard mules={[{ ...mule, selectedBosses: [] }]} />);
    expect(bignumText()).toBe('0');
  });

  it('preserves abbreviated format when total income transitions to zero then back', () => {
    const nonzero: Mule[] = [{ ...mule, selectedBosses: [HARD_LUCID] }];
    const zero: Mule[] = [{ ...mule, selectedBosses: [] }];
    const { rerender } = render(<KpiCard mules={nonzero} />);
    expect(bignumText()).toBe('504M');
    rerender(<KpiCard mules={zero} />);
    expect(bignumText()).toBe('0');
    // Format preference stays abbreviated — back to non-zero renders abbreviated.
    rerender(<KpiCard mules={nonzero} />);
    expect(bignumText()).toBe('504M');
  });

  it('does not count mules with active: false even if they have bosses selected', () => {
    const mules: Mule[] = [
      { ...mule, id: 'a', active: true, selectedBosses: [] },
      { ...mule, id: 'b', active: false, selectedBosses: ['x:hard:weekly'] },
    ];
    render(<KpiCard mules={mules} />);
    expect(activeStatValue()).toBe('1');
  });

  describe('hybrid layout', () => {
    it('renders the Reset Countdown inside the income card (top-right)', () => {
      render(<KpiCard mules={[mule]} />);
      const card = screen.getByTestId('income-card');
      expect(within(card).getByText(/RESET IN/i)).toBeTruthy();
    });

    it('renders the WEEKLY CAP rail at the bottom with a progressbar role', () => {
      render(<KpiCard mules={[mule]} />);
      const card = screen.getByTestId('income-card');
      expect(within(card).getByRole('progressbar')).toBeTruthy();
      expect(within(card).getByText('WEEKLY CAP')).toBeTruthy();
    });

    describe('narrow viewport (<480px)', () => {
      afterEach(() => {
        restoreMatchMedia();
      });

      it('uses a 2x2 grid for the stat row', () => {
        mockNarrowViewport(400);
        render(<KpiCard mules={[mule]} />);
        const card = screen.getByTestId('income-card');
        const statRow = within(card).getByTestId('kpi-stat-row');
        expect(statRow.style.display).toBe('grid');
      });

      it('stacks the eyebrow row (countdown drops below the title)', () => {
        mockNarrowViewport(400);
        render(<KpiCard mules={[mule]} />);
        const card = screen.getByTestId('income-card');
        const eyebrowRow = within(card).getByTestId('kpi-eyebrow-row');
        expect(eyebrowRow.style.flexDirection).toBe('column');
      });

      it('keeps the desktop flex layout when matchMedia is unavailable', () => {
        render(<KpiCard mules={[mule]} />);
        const card = screen.getByTestId('income-card');
        const statRow = within(card).getByTestId('kpi-stat-row');
        expect(statRow.style.display).toBe('flex');
      });
    });
  });
});

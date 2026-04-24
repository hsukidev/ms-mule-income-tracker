import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@/test/test-utils';
import { WeeklyCapRail } from '../WeeklyCapRail';

describe('WeeklyCapRail', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function flushAnimation() {
    act(() => {
      vi.advanceTimersByTime(800);
    });
  }

  it('renders the WEEKLY CAP label, the count, and a rounded percent', () => {
    const { container } = render(<WeeklyCapRail crystalTotal={37} cap={180} />);
    flushAnimation();
    expect(screen.getByText('WEEKLY CAP')).toBeTruthy();
    // 37/180 ≈ 20.55%, rounds to 21%
    expect(container.textContent).toContain('37');
    expect(container.textContent).toContain('180');
    expect(container.textContent).toContain('21%');
  });

  it('reports 100% on the progressbar when crystalTotal equals cap', () => {
    render(<WeeklyCapRail crystalTotal={180} cap={180} />);
    flushAnimation();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('clamps bar width AND percent text at 100% on overflow, but raw count reveals the overflow', () => {
    const { container } = render(<WeeklyCapRail crystalTotal={185} cap={180} />);
    flushAnimation();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('100%');
    expect(container.textContent).toContain('100%');
    expect(container.textContent).toContain('185');
    // The cap denominator is still shown so users see "185 / 180".
    expect(container.textContent).toContain('180');
  });

  it('starts the bar at width 0% on first render (mount entrance from 0)', () => {
    render(<WeeklyCapRail crystalTotal={90} cap={180} />);
    // Do not flush — read the very first paint.
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });
});

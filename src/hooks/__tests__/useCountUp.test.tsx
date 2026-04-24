import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCountUp } from '../useCountUp';

describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 0 on first render (mount entrance from 0%)', () => {
    const { result } = renderHook(() => useCountUp(100, 600));
    expect(result.current).toBe(0);
  });

  it('reaches the target after the duration elapses', () => {
    const { result } = renderHook(() => useCountUp(100, 600));
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(result.current).toBe(100);
  });

  it('animates toward a new target when target changes', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 600), {
      initialProps: { target: 100 },
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(result.current).toBe(100);

    rerender({ target: 50 });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(result.current).toBe(50);
  });
});

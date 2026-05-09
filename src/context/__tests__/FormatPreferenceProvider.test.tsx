import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  FormatPreferenceProvider,
  useFormatPreference,
  useAutoFullFormatOnZero,
} from '../FormatPreferenceProvider';

function Consumer() {
  const { abbreviated, toggle } = useFormatPreference();
  return (
    <div>
      <span data-testid="abbreviated">{String(abbreviated)}</span>
      <button onClick={toggle}>toggle</button>
    </div>
  );
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <FormatPreferenceProvider>{children}</FormatPreferenceProvider>
);

const wrapperFull = ({ children }: { children: ReactNode }) => (
  <FormatPreferenceProvider defaultAbbreviated={false}>{children}</FormatPreferenceProvider>
);

describe('FormatPreferenceProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults abbreviated to true', () => {
    render(
      <FormatPreferenceProvider>
        <Consumer />
      </FormatPreferenceProvider>,
    );
    expect(screen.getByTestId('abbreviated').textContent).toBe('true');
  });

  it('respects defaultAbbreviated={false} prop', () => {
    render(
      <FormatPreferenceProvider defaultAbbreviated={false}>
        <Consumer />
      </FormatPreferenceProvider>,
    );
    expect(screen.getByTestId('abbreviated').textContent).toBe('false');
  });

  it('toggle() flips abbreviated', () => {
    render(
      <FormatPreferenceProvider>
        <Consumer />
      </FormatPreferenceProvider>,
    );
    expect(screen.getByTestId('abbreviated').textContent).toBe('true');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('abbreviated').textContent).toBe('false');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('abbreviated').textContent).toBe('true');
  });

  it('persists abbreviated state to localStorage on change', () => {
    render(
      <FormatPreferenceProvider>
        <Consumer />
      </FormatPreferenceProvider>,
    );
    fireEvent.click(screen.getByText('toggle'));
    expect(localStorage.getItem('abbreviated')).toBe('false');
    fireEvent.click(screen.getByText('toggle'));
    expect(localStorage.getItem('abbreviated')).toBe('true');
  });

  it('reads initial abbreviated from localStorage', () => {
    localStorage.setItem('abbreviated', 'false');
    render(
      <FormatPreferenceProvider>
        <Consumer />
      </FormatPreferenceProvider>,
    );
    expect(screen.getByTestId('abbreviated').textContent).toBe('false');
  });

  it('round-trips through localStorage across remounts', () => {
    const { unmount } = render(
      <FormatPreferenceProvider>
        <Consumer />
      </FormatPreferenceProvider>,
    );
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('abbreviated').textContent).toBe('false');
    unmount();
    render(
      <FormatPreferenceProvider>
        <Consumer />
      </FormatPreferenceProvider>,
    );
    expect(screen.getByTestId('abbreviated').textContent).toBe('false');
  });

  it('throws when useFormatPreference is called outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useFormatPreference())).toThrow(/FormatPreferenceProvider/);
    spy.mockRestore();
  });
});

describe('useAutoFullFormatOnZero', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('flips abbreviated → full once when raw === 0 && abbreviated', () => {
    const { result } = renderHook(
      () => {
        const fp = useFormatPreference();
        useAutoFullFormatOnZero(0);
        return fp;
      },
      { wrapper },
    );
    expect(result.current.abbreviated).toBe(false);
  });

  it('is idempotent across re-renders of the same zero+abbreviated state', () => {
    const { result, rerender } = renderHook(
      () => {
        const fp = useFormatPreference();
        useAutoFullFormatOnZero(0);
        return fp;
      },
      { wrapper },
    );
    expect(result.current.abbreviated).toBe(false);
    rerender();
    expect(result.current.abbreviated).toBe(false);
    rerender();
    expect(result.current.abbreviated).toBe(false);
  });

  it('no-ops when raw > 0', () => {
    const { result } = renderHook(
      () => {
        const fp = useFormatPreference();
        useAutoFullFormatOnZero(100);
        return fp;
      },
      { wrapper },
    );
    expect(result.current.abbreviated).toBe(true);
  });

  it('no-ops when abbreviated === false', () => {
    const { result } = renderHook(
      () => {
        const fp = useFormatPreference();
        useAutoFullFormatOnZero(0);
        return fp;
      },
      { wrapper: wrapperFull },
    );
    expect(result.current.abbreviated).toBe(false);
  });

  it('resets when raw becomes non-zero so a future zero re-fires', () => {
    const { result, rerender } = renderHook(
      ({ raw }: { raw: number }) => {
        const fp = useFormatPreference();
        useAutoFullFormatOnZero(raw);
        return fp;
      },
      { wrapper, initialProps: { raw: 0 } },
    );
    expect(result.current.abbreviated).toBe(false);
    rerender({ raw: 100 });
    act(() => {
      result.current.toggle();
    });
    expect(result.current.abbreviated).toBe(true);
    rerender({ raw: 0 });
    expect(result.current.abbreviated).toBe(false);
  });

  it('throws when called outside a FormatPreferenceProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAutoFullFormatOnZero(0))).toThrow(/FormatPreferenceProvider/);
    spy.mockRestore();
  });
});

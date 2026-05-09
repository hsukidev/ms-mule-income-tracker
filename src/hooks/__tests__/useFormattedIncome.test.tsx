import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  FormatPreferenceProvider,
  useFormatPreference,
} from '../../context/FormatPreferenceProvider';
import { useFormattedIncome } from '../useFormattedIncome';

const wrapperAbbrev = ({ children }: { children: ReactNode }) => (
  <FormatPreferenceProvider defaultAbbreviated={true}>{children}</FormatPreferenceProvider>
);

const wrapperFull = ({ children }: { children: ReactNode }) => (
  <FormatPreferenceProvider defaultAbbreviated={false}>{children}</FormatPreferenceProvider>
);

describe('useFormattedIncome', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns abbreviated string from format preference (abbreviated=true)', () => {
    const { result } = renderHook(() => useFormattedIncome(504_000_000), {
      wrapper: wrapperAbbrev,
    });
    expect(result.current.abbreviated).toBe('504M');
  });

  it('returns the full-precision string under .full regardless of preference', () => {
    const { result } = renderHook(() => useFormattedIncome(504_000_000), {
      wrapper: wrapperAbbrev,
    });
    expect(result.current.full).toBe('504,000,000');
  });

  it('returns full-format string for .abbreviated when preference is full', () => {
    const { result } = renderHook(() => useFormattedIncome(504_000_000), {
      wrapper: wrapperFull,
    });
    expect(result.current.abbreviated).toBe('504,000,000');
    expect(result.current.full).toBe('504,000,000');
  });

  it('opts.force === true forces abbreviated regardless of preference', () => {
    const { result } = renderHook(() => useFormattedIncome(504_000_000, { force: true }), {
      wrapper: wrapperFull,
    });
    expect(result.current.abbreviated).toBe('504M');
    // .full is always full-precision
    expect(result.current.full).toBe('504,000,000');
  });

  it('opts.force === false leaves preference in charge', () => {
    const { result } = renderHook(() => useFormattedIncome(504_000_000, { force: false }), {
      wrapper: wrapperFull,
    });
    expect(result.current.abbreviated).toBe('504,000,000');
  });

  it('toggling preference updates the abbreviated readout', () => {
    const { result } = renderHook(
      () => {
        const fp = useFormatPreference();
        const fmt = useFormattedIncome(504_000_000);
        return { fp, fmt };
      },
      { wrapper: wrapperAbbrev },
    );
    expect(result.current.fmt.abbreviated).toBe('504M');
    act(() => {
      result.current.fp.toggle();
    });
    expect(result.current.fmt.abbreviated).toBe('504,000,000');
  });
});

import { useCallback, useState, type ChangeEvent } from 'react';

/**
 * Generic Draft Field primitive. Holds a local `draft` state that diverges
 * from the authoritative `source` until the user blurs; then `commit(draft)`
 * is called iff `!equals(draft, source)`. An external `source` change
 * (Draft Source Resync) rebases `draft` when it no longer matches source.
 *
 * The Draft-Commit split is what lets the roster pie chart and cards stay
 * still while the user types in the drawer — per-keystroke `setMules` would
 * thrash the whole tree.
 */
export function useDraftField<T>(
  source: T,
  commit: (v: T) => void,
  opts?: {
    parse?: (raw: string) => T;
    equals?: (a: T, b: T) => boolean;
  },
): {
  draft: T;
  setDraft: (v: T) => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
} {
  const equals = opts?.equals ?? defaultEquals<T>;
  const parse = opts?.parse;

  const [draft, setDraft] = useState<T>(source);
  // Track the last-seen `source` as state so React's official
  // "reset state when a prop changes" pattern applies: compare in render,
  // call setState during render, React discards and reruns with the fresh
  // value. No refs during render.
  const [lastSource, setLastSource] = useState<T>(source);
  if (!equals(lastSource, source)) {
    setLastSource(source);
    if (!equals(draft, source)) {
      setDraft(source);
    }
  }

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.currentTarget.value;
      const next = parse ? parse(raw) : (raw as unknown as T);
      setDraft(next);
    },
    [parse],
  );

  const onBlur = useCallback(() => {
    if (!equals(draft, source)) {
      commit(draft);
    }
  }, [draft, source, commit, equals]);

  return { draft, setDraft, onChange, onBlur };
}

function defaultEquals<T>(a: T, b: T): boolean {
  return Object.is(a, b);
}

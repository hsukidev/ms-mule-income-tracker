import { useCallback, type ChangeEvent } from 'react';
import type { Mule } from '../../../types';
import { sanitizeMuleName } from '../../../utils/muleName';
import { useDraftField } from './useDraftField';
import { useCommitOnExit } from './useCommitOnExit';

const LEVEL_MAX = 300;
const LEVEL_MIN_NONZERO = 1;

/** Clamp a non-empty level string to [1, 300]; empty string maps to 0. */
function clampLevel(raw: string): number {
  if (raw === '') return 0;
  return Math.min(LEVEL_MAX, Math.max(LEVEL_MIN_NONZERO, Number(raw)));
}

/**
 * Mule Identity Draft: pairs name + level Draft Fields with a single
 * Commit On Exit so callers cannot forget the pairing. Owns the name
 * sanitizer, Level Clamp 0–300, and digit-only input stripping.
 *
 * Level is held as a string draft (the `<input type="text" inputMode="numeric">`
 * lets users briefly type "500" before the blur clamps it to 300). Commit
 * converts the string to a clamped number and mirrors the clamp back into
 * the draft so the input visibly reflects the clamp before the parent's
 * mule prop re-renders.
 */
export function useMuleIdentityDraft(
  mule: Mule | null,
  onUpdate: (id: string, patch: Partial<Omit<Mule, 'id'>>) => void,
): {
  name: {
    draft: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
  };
  level: {
    draft: string;
    displayNumber: number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
  };
} {
  const muleId = mule?.id ?? null;
  const sourceName = mule?.name ?? '';
  const sourceLevelStr = mule?.level ? String(mule.level) : '';

  const commitName = useCallback(
    (v: string) => {
      if (muleId) onUpdate(muleId, { name: v });
    },
    [muleId, onUpdate],
  );

  const name = useDraftField<string>(sourceName, commitName, {
    parse: sanitizeMuleName,
  });

  // We don't pass a commit to level's useDraftField because the level blur
  // has two extra concerns (clamp write-back + empty→0) that need access to
  // `level.setDraft`. We rebind onBlur below.
  const level = useDraftField<string>(sourceLevelStr, () => {}, {
    parse: (raw) => raw.replace(/\D/g, '').slice(0, 3),
  });

  const levelOnBlur = useCallback(() => {
    if (!muleId || level.draft === sourceLevelStr) return;
    const clamped = clampLevel(level.draft);
    const clampedStr = level.draft === '' ? '' : String(clamped);
    if (clampedStr !== level.draft) level.setDraft(clampedStr);
    onUpdate(muleId, { level: clamped });
  }, [muleId, level, sourceLevelStr, onUpdate]);

  // Commit On Exit flushes both drafts on Mule Switch / Drawer Close.
  // Gate each field with its own equality check so we never emit a no-op
  // write, and route level through the same clamp as onBlur.
  useCommitOnExit<{ name: string; level: string }>(
    muleId,
    { name: name.draft, level: level.draft },
    useCallback(
      (id, patch) => {
        const update: Partial<Omit<Mule, 'id'>> = {};
        if (patch.name !== undefined && patch.name !== sourceName) {
          update.name = patch.name;
        }
        if (patch.level !== undefined && patch.level !== sourceLevelStr) {
          update.level = clampLevel(patch.level);
        }
        if (Object.keys(update).length > 0) {
          onUpdate(id, update);
        }
      },
      [onUpdate, sourceName, sourceLevelStr],
    ),
  );

  const displayNumber = Number(level.draft) || 0;

  return {
    name: {
      draft: name.draft,
      onChange: name.onChange,
      onBlur: name.onBlur,
    },
    level: {
      draft: level.draft,
      displayNumber,
      onChange: level.onChange,
      onBlur: levelOnBlur,
    },
  };
}

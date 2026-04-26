import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Mule } from '../../../types';
import { sanitizeMuleName } from '../../../utils/muleName';

const LEVEL_MAX = 300;
const LEVEL_MIN_NONZERO = 1;

function clampLevel(raw: string): number {
  if (raw === '') return 0;
  return Math.min(LEVEL_MAX, Math.max(LEVEL_MIN_NONZERO, Number(raw)));
}

function parseLevelInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 3);
}

type IdentityDrafts = { name: string; level: string };

/**
 * Owns the Drawer's name + level draft state and the entire editing
 * lifecycle in one place — hardcoded for the `{ name, level }` shape:
 *
 *  - Draft Source Resync: when the mule prop's name or level changes
 *    externally, rebase the corresponding local draft using React's
 *    "store info from previous renders" render-time setState pattern.
 *  - Commit On Exit: flush unblurred drafts on Mule Switch (muleId
 *    changes) and on Drawer Close (unmount). Initial mount is suppressed.
 *  - Snapshot-before-rebase: each render captures its drafts in a ref so
 *    the flush effect can read the OUTGOING mule's drafts even though the
 *    Draft Source Resync has already rebased state to the incoming mule.
 *  - Level clamp: blur and flush coerce the level string into an integer
 *    in [1, 300] so the input can briefly show "500" before blur clamps
 *    it visibly to 300; empty maps to 0.
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
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
  };
} {
  const muleId = mule?.id ?? null;
  const sourceName = mule?.name ?? '';
  const sourceLevelStr = mule?.level ? String(mule.level) : '';

  const [nameDraft, setNameDraft] = useState<string>(sourceName);
  const [levelDraft, setLevelDraft] = useState<string>(sourceLevelStr);

  // Snapshot-before-rebase: capture this render's drafts under the CURRENT
  // muleId, BEFORE the Draft Source Resync block (below) potentially rebases
  // them to the incoming mule's source. This must run during render — it
  // cannot move into effect cleanup, because cleanup fires AFTER the calling
  // component has already rebased the `mule` prop and our resync has already
  // overwritten the drafts. By that point the outgoing mule's unblurred edits
  // are gone.
  const prevDraftsForMuleRef = useRef<IdentityDrafts>({
    name: nameDraft,
    level: levelDraft,
  });
  const muleIdRef = useRef<string | null>(muleId);
  const muleSwitched = muleIdRef.current !== muleId;
  if (!muleSwitched) {
    prevDraftsForMuleRef.current = { name: nameDraft, level: levelDraft };
  }

  // Draft Source Resync — render-time setState, applied separately to name
  // and level so an external write to one field doesn't blow away an
  // unblurred edit on the other.
  const [lastSourceName, setLastSourceName] = useState<string>(sourceName);
  if (lastSourceName !== sourceName) {
    setLastSourceName(sourceName);
    if (nameDraft !== sourceName) setNameDraft(sourceName);
  }
  const [lastSourceLevel, setLastSourceLevel] = useState<string>(sourceLevelStr);
  if (lastSourceLevel !== sourceLevelStr) {
    setLastSourceLevel(sourceLevelStr);
    if (levelDraft !== sourceLevelStr) setLevelDraft(sourceLevelStr);
  }

  // Latest-closure ref for the flush callback. Both the Mule Switch effect
  // and the unmount cleanup read this ref so they always see the freshest
  // source comparisons and the freshest `onUpdate` identity. Equality with
  // source skips no-op writes; level is routed through the same clamp as
  // onBlur so a switch/close commits the visible value.
  const flushRef = useRef<(id: string, drafts: IdentityDrafts) => void>(() => {});
  flushRef.current = (id, drafts) => {
    const update: Partial<Omit<Mule, 'id'>> = {};
    if (drafts.name !== sourceName) update.name = drafts.name;
    if (drafts.level !== sourceLevelStr) update.level = clampLevel(drafts.level);
    if (Object.keys(update).length > 0) onUpdate(id, update);
  };

  // Mule Switch flush. Depends only on muleId — adding `nameDraft` /
  // `levelDraft` to the deps would re-run the effect on every keystroke,
  // advance muleIdRef on each render, and leave the next true switch with
  // nothing to flush. The render-time snapshot above is what makes this
  // single-dep effect safe; this disable protects that pattern.
  useEffect(() => {
    const prevId = muleIdRef.current;
    if (prevId !== null && prevId !== muleId) {
      flushRef.current(prevId, prevDraftsForMuleRef.current);
    }
    prevDraftsForMuleRef.current = { name: nameDraft, level: levelDraft };
    muleIdRef.current = muleId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muleId]);

  // Drawer Close flush.
  useEffect(() => {
    return () => {
      const id = muleIdRef.current;
      if (id !== null) {
        flushRef.current(id, prevDraftsForMuleRef.current);
      }
    };
  }, []);

  const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setNameDraft(sanitizeMuleName(e.currentTarget.value));
  }, []);

  const onNameBlur = useCallback(() => {
    if (muleId === null) return;
    if (nameDraft === sourceName) return;
    onUpdate(muleId, { name: nameDraft });
  }, [muleId, nameDraft, sourceName, onUpdate]);

  const onLevelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLevelDraft(parseLevelInput(e.currentTarget.value));
  }, []);

  const onLevelBlur = useCallback(() => {
    if (muleId === null) return;
    if (levelDraft === sourceLevelStr) return;
    const clamped = clampLevel(levelDraft);
    const clampedStr = levelDraft === '' ? '' : String(clamped);
    if (clampedStr !== levelDraft) setLevelDraft(clampedStr);
    onUpdate(muleId, { level: clamped });
  }, [muleId, levelDraft, sourceLevelStr, onUpdate]);

  return {
    name: { draft: nameDraft, onChange: onNameChange, onBlur: onNameBlur },
    level: { draft: levelDraft, onChange: onLevelChange, onBlur: onLevelBlur },
  };
}

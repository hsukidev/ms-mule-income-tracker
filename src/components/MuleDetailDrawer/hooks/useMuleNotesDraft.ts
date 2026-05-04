import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Mule } from '../../../types';
import { sanitizeMuleNotes } from '../../../utils/muleNotes';

/**
 * Owns the Drawer's Notes Field draft state and the commit lifecycle:
 *
 *  - Draft Source Resync: when `mule.notes` changes externally, rebase the
 *    local draft via React's render-time setState pattern.
 *  - Commit On Exit: flush an unblurred draft on Mule Switch and on Drawer
 *    Close (unmount). Initial mount is suppressed.
 *  - Snapshot-before-rebase: each render captures its draft in a ref so
 *    the flush effect can read the OUTGOING mule's draft even though the
 *    Draft Source Resync has already rebased state to the incoming mule.
 *  - Empty normalization: trim-equality drives the diff; whitespace-only
 *    drafts commit as `notes: undefined` so Has Notes stays a single
 *    length-after-trim predicate.
 */
export function useMuleNotesDraft(
  mule: Mule | null,
  onUpdate: (id: string, patch: Partial<Omit<Mule, 'id'>>) => void,
): {
  draft: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
} {
  const muleId = mule?.id ?? null;
  const sourceNotes = mule?.notes ?? '';

  const [draft, setDraft] = useState<string>(sourceNotes);

  // Snapshot-before-rebase: capture this render's draft under the CURRENT
  // muleId, BEFORE the Draft Source Resync below potentially rebases it.
  const prevDraftForMuleRef = useRef<string>(draft);
  const muleIdRef = useRef<string | null>(muleId);
  const muleSwitched = muleIdRef.current !== muleId;
  if (!muleSwitched) {
    prevDraftForMuleRef.current = draft;
  }

  // Draft Source Resync — render-time setState.
  const [lastSourceNotes, setLastSourceNotes] = useState<string>(sourceNotes);
  if (lastSourceNotes !== sourceNotes) {
    setLastSourceNotes(sourceNotes);
    if (draft !== sourceNotes) setDraft(sourceNotes);
  }

  // Latest-closure ref for the commit callback. Read by Mule Switch flush,
  // Drawer Close cleanup, AND onBlur — so they all share the same trim /
  // diff / empty-normalize semantics and always see the freshest
  // sourceNotes + onUpdate identity.
  const commitRef = useRef<(id: string, d: string) => void>(() => {});
  commitRef.current = (id, d) => {
    const trimmed = d.trim();
    if (trimmed === sourceNotes.trim()) return;
    onUpdate(id, { notes: trimmed === '' ? undefined : trimmed });
  };

  // Mule Switch flush. Depends only on muleId — adding `draft` to deps would
  // re-run the effect on every keystroke, advance muleIdRef each render, and
  // leave the next true switch with nothing to flush.
  useEffect(() => {
    const prevId = muleIdRef.current;
    if (prevId !== null && prevId !== muleId) {
      commitRef.current(prevId, prevDraftForMuleRef.current);
    }
    prevDraftForMuleRef.current = draft;
    muleIdRef.current = muleId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muleId]);

  // Drawer Close flush.
  useEffect(() => {
    return () => {
      const id = muleIdRef.current;
      if (id !== null) {
        commitRef.current(id, prevDraftForMuleRef.current);
      }
    };
  }, []);

  const onChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(sanitizeMuleNotes(e.currentTarget.value));
  }, []);

  const onBlur = useCallback(() => {
    if (muleId === null) return;
    commitRef.current(muleId, draft);
  }, [muleId, draft]);

  return { draft, onChange, onBlur };
}

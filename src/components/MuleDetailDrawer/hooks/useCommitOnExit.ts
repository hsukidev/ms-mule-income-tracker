import { useEffect, useRef } from 'react';

/**
 * Commit On Exit: flushes pending drafts on TWO boundaries —
 *
 *  1. Mule Switch: when `muleId` changes from A → B, flush A's drafts before
 *     B takes over.
 *  2. Drawer Close: when the hook unmounts, flush the current mule's drafts.
 *
 * Initial mount is suppressed so opening the drawer does not emit a spurious
 * `commit(id, {})`.
 *
 * Callers pass their live `drafts` object every render; the hook keeps a
 * ref pointing at the drafts associated with the most recent `muleId` so a
 * Mule Switch (muleId changes) flushes the PREVIOUS mule's drafts — even
 * when the caller has already rebased its local state to the next mule in
 * the same render. Same ref-dance for `commit` so the unmount cleanup uses
 * the latest caller.
 *
 * Closes the Esc/backdrop drop-drafts bug that lived in the drawer's
 * `useEffect([mule?.id])` — that effect only flushed on switch, so closing
 * the drawer via Esc or backdrop click silently dropped unblurred edits.
 */
export function useCommitOnExit<D extends Record<string, unknown>>(
  muleId: string | null,
  drafts: D,
  commit: (id: string, patch: Partial<D>) => void,
): void {
  // `drafts` we saw during the render that owned `muleId`. When `muleId`
  // changes, `drafts` may already have rebased to the new mule's seed — so
  // we capture the previous drafts here, BEFORE updating on the next line.
  const prevDraftsForMuleRef = useRef(drafts);
  const muleIdRef = useRef<string | null>(muleId);

  // If muleId is unchanged since last render, track the latest drafts for
  // the current mule. If muleId *did* change, freeze prevDraftsForMuleRef
  // at the last-seen drafts for the previous mule — the effect below will
  // flush with that snapshot.
  const muleSwitched = muleIdRef.current !== muleId;
  if (!muleSwitched) {
    prevDraftsForMuleRef.current = drafts;
  }

  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    const prevId = muleIdRef.current;
    if (prevId !== null && prevId !== muleId) {
      commitRef.current(prevId, prevDraftsForMuleRef.current);
    }
    // After the flush, drafts for the current (new) mule take over.
    prevDraftsForMuleRef.current = drafts;
    muleIdRef.current = muleId;
    // Intentionally depend only on muleId: draft changes that don't flip
    // muleId must not re-run this effect, or we'd flush every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muleId]);

  // Unmount-only cleanup. Reads the latest muleId + drafts via refs.
  useEffect(() => {
    return () => {
      const id = muleIdRef.current;
      if (id !== null) {
        commitRef.current(id, prevDraftsForMuleRef.current);
      }
    };
  }, []);
}

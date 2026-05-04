import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Mule } from '../../types';
import { MULE_NOTES_MAX_LENGTH } from '../../utils/muleNotes';
import { FIELD_INPUT_CLASS, FIELD_LABEL_CLASS } from './fieldStyles';
import { useMuleNotesDraft } from './hooks/useMuleNotesDraft';

interface Props {
  mule: Mule | null;
  onUpdate: (id: string, patch: Partial<Omit<Mule, 'id'>>) => void;
}

/**
 * Renders the Notes Field — labeled textarea + bottom-right Character
 * Counter — between the identity inputs and the Boss Matrix toolbar in
 * the drawer body.
 *
 * Owns its `useMuleNotesDraft` hook so per-keystroke state updates stay
 * contained to this subtree and don't re-render the rest of the drawer
 * (BossMatrix, header, etc.). The drawer never reads `notes.draft`, so
 * nothing upstream needs the lifted state.
 *
 * Wrapped in `memo` so identity-name / level keystrokes — which re-render
 * the drawer but don't change `mule` or `onUpdate` until commit — skip
 * the field's re-render entirely.
 */
export const MuleNotesField = memo(function MuleNotesField({ mule, onUpdate }: Props) {
  const notes = useMuleNotesDraft(mule, onUpdate);
  return (
    <div className="space-y-1.5">
      <Label htmlFor="mule-notes" className={FIELD_LABEL_CLASS}>
        Notes
      </Label>
      <div className="relative">
        <Textarea
          id="mule-notes"
          placeholder="Add notes about this character"
          value={notes.draft}
          onChange={notes.onChange}
          onBlur={notes.onBlur}
          maxLength={MULE_NOTES_MAX_LENGTH}
          rows={3}
          className={`${FIELD_INPUT_CLASS} min-h-[88px] max-h-[220px] resize-y pointer-coarse:resize-none pb-6 placeholder:text-[13px]`}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 bottom-1.5 select-none font-mono-nums text-[12px] tracking-[0.06em] text-muted-foreground/70"
          data-testid="notes-character-counter"
        >
          {notes.draft.length} / {MULE_NOTES_MAX_LENGTH}
        </span>
      </div>
    </div>
  );
});

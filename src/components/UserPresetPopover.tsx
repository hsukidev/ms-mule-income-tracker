import { memo, useRef, useState, type KeyboardEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { PopoverContent } from '@/components/ui/popover';
import type { UserPreset } from '../data/userPresets';

interface UserPresetPopoverProps {
  /** Library of saved User Presets. Empty array → empty-state copy. */
  userPresets: readonly UserPreset[];
  /** Current Boss Slate keys, used for "save current" + match highlight. */
  slateKeys: readonly string[];
  /** The User Preset whose `slateKeys` set-equals `slateKeys`, or `null`. */
  matchedUserPreset: UserPreset | null;
  /** Apply a saved snapshot to the open Mule, then close the popover. */
  onApply: (presetId: string) => void;
  /** Save the current slate under the typed name, then close the popover. */
  onSave: (name: string, slateKeys: readonly string[]) => void;
  /** Delete a saved preset (hover-revealed × affordance). */
  onDelete: (presetId: string) => void;
}

/**
 * **User Preset Popover** body. Anchors under the **Custom Preset** pill
 * via `PopoverContent` (the trigger + open-state live in
 * `MatrixToolbar`). Drawer perf invariants apply: search-query +
 * name-error state lives here, not in the drawer, so typing in the
 * search input does not re-render `MuleDetailDrawer` or `BossMatrix`.
 *
 * Slice 3 polish (issue #252):
 * - Empty-name click → `aria-invalid` red border + role=tooltip "Enter
 *   a name for this preset", input refocused; cleared on first keystroke.
 * - Typed name case-insensitive-collides with an existing preset →
 *   button disabled, role=tooltip "Name already in use", colliding row
 *   highlighted with the same `aria-current="true"` treatment as a
 *   User Preset Match (the row is the escape hatch).
 * - Enter in input submits when valid; empty triggers the empty-name
 *   flow; collision is a no-op.
 * - Escape closure is handled natively by the base-ui Popover root
 *   (`MatrixToolbar` owns the controlled `open` state and reacts to the
 *   `escapeKey` reason in `onOpenChange`).
 */
export const UserPresetPopover = memo(function UserPresetPopover({
  userPresets,
  slateKeys,
  matchedUserPreset,
  onApply,
  onSave,
  onDelete,
}: UserPresetPopoverProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [nameError, setNameError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = searchQuery.trim();
  const filterLower = searchQuery.toLowerCase();
  const filtered = userPresets.filter((p) => p.name.toLowerCase().includes(filterLower));

  // Collision: a typed name (after trim) case-insensitive-equals an
  // existing preset name. The colliding row is the escape hatch — the
  // user can apply it instead of renaming.
  const trimmedLower = trimmed.toLowerCase();
  const collidingPreset =
    trimmed.length > 0
      ? (userPresets.find((p) => p.name.toLowerCase() === trimmedLower) ?? null)
      : null;
  const hasCollision = collidingPreset !== null;

  const slateEmpty = slateKeys.length === 0;
  const presetMatched = matchedUserPreset !== null;
  const saveHidden = slateEmpty;
  // Disabled on slate-match (already saved) and on name collision. An
  // empty name is NOT a disabled state — clicking with an empty name
  // is the trigger for the empty-name tooltip flow.
  const saveDisabled = presetMatched || hasCollision;

  const handleChange = (next: string) => {
    if (nameError) setNameError(false);
    setSearchQuery(next);
  };

  const handleSubmit = () => {
    if (saveHidden) return;
    if (trimmed.length === 0) {
      setNameError(true);
      inputRef.current?.focus();
      return;
    }
    if (saveDisabled) return;
    onSave(trimmed, slateKeys);
    setSearchQuery('');
    setNameError(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleApply = (presetId: string) => {
    onApply(presetId);
    setSearchQuery('');
    setNameError(false);
  };

  // Highlight both the slate-matched row (User Preset Match) and the
  // colliding row (typed-name collision) with the same `aria-current`
  // treatment — the colliding row doubles as the "apply this instead"
  // escape hatch.
  const highlightedIds = new Set<string>();
  if (matchedUserPreset) highlightedIds.add(matchedUserPreset.id);
  if (collidingPreset) highlightedIds.add(collidingPreset.id);

  return (
    <PopoverContent
      data-user-preset-popover
      side="bottom"
      align="center"
      className="w-80 max-w-[90vw] gap-3 bg-(--surface) ring-(--border-raw)"
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={40}
          placeholder="Search or name a new preset"
          aria-label="Search or name a new preset"
          aria-invalid={nameError || undefined}
          aria-describedby={nameError ? 'user-preset-name-error' : undefined}
          className="w-full rounded-md border border-border/60 bg-(--surface-2) px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive"
        />
        {nameError && (
          <div
            id="user-preset-name-error"
            role="tooltip"
            className="pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 -translate-x-1/2 rounded-md bg-popover px-2.5 py-1.5 font-mono text-[10px] tracking-[0.06em] text-popover-foreground uppercase whitespace-nowrap shadow-md ring-1 ring-foreground/10"
          >
            Enter a name for this preset
          </div>
        )}
      </div>

      <PresetList
        presets={filtered}
        totalCount={userPresets.length}
        searchQuery={searchQuery}
        slateEmpty={slateEmpty}
        highlightedIds={highlightedIds}
        onApply={handleApply}
        onDelete={onDelete}
      />

      {!saveHidden && (
        <div className="relative">
          <button
            type="button"
            disabled={saveDisabled}
            onClick={handleSubmit}
            aria-describedby={hasCollision ? 'user-preset-collision-error' : undefined}
            className="w-full rounded-md border border-dashed border-border/70 bg-transparent px-3 py-2 text-sm text-foreground transition-colors hover:bg-(--accent-soft) disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Save current as preset
          </button>
          {hasCollision && (
            <div
              id="user-preset-collision-error"
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 rounded-md bg-popover px-2.5 py-1.5 font-mono text-[10px] tracking-[0.06em] text-popover-foreground uppercase whitespace-nowrap shadow-md ring-1 ring-foreground/10"
            >
              Name already in use
            </div>
          )}
        </div>
      )}
    </PopoverContent>
  );
});

interface PresetListProps {
  presets: readonly UserPreset[];
  totalCount: number;
  searchQuery: string;
  slateEmpty: boolean;
  highlightedIds: ReadonlySet<string>;
  onApply: (presetId: string) => void;
  onDelete: (presetId: string) => void;
}

function PresetList({
  presets,
  totalCount,
  searchQuery,
  slateEmpty,
  highlightedIds,
  onApply,
  onDelete,
}: PresetListProps) {
  if (totalCount === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-1 px-2 py-6 text-center text-sm text-muted-foreground"
      >
        <span>No presets saved yet</span>
        {slateEmpty && <span className="text-xs">Select bosses to save preset</span>}
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-1 px-2 py-6 text-center text-sm text-muted-foreground"
      >
        <span>No presets match `{searchQuery}`</span>
      </div>
    );
  }

  return (
    <ul className="max-h-64 overflow-y-auto" role="list" aria-label="Saved user presets">
      {presets.map((p) => (
        <PresetRow
          key={p.id}
          preset={p}
          active={highlightedIds.has(p.id)}
          onApply={onApply}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

interface PresetRowProps {
  preset: UserPreset;
  active: boolean;
  onApply: (presetId: string) => void;
  onDelete: (presetId: string) => void;
}

function PresetRow({ preset, active, onApply, onDelete }: PresetRowProps) {
  return (
    <li className="group flex items-center gap-1">
      <button
        type="button"
        onClick={() => onApply(preset.id)}
        aria-current={active ? 'true' : undefined}
        className={`flex-1 truncate rounded-md px-3 py-2 text-left text-sm transition-colors ${
          active
            ? 'bg-(--accent-soft) text-foreground font-medium'
            : 'text-foreground/90 hover:bg-(--surface-2)'
        }`}
      >
        {preset.name}
      </button>
      <button
        type="button"
        aria-label={`Delete ${preset.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(preset.id);
        }}
        className="invisible mr-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}

import { memo, useState } from 'react';
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
 * `MatrixToolbar`). Drawer perf invariants apply: search-query state
 * lives here, not in the drawer, so typing in the search input does not
 * re-render `MuleDetailDrawer` or `BossMatrix`.
 *
 * Out of scope for the MVP slice (Slice 2): empty-name red-border +
 * tooltip flow, collision tooltip with row highlight, Enter-to-submit,
 * Escape-to-close, hover-delete `×` confirm-step. The footer save
 * button is hidden on empty slate, disabled when a saved preset
 * matches, and otherwise enabled.
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
  const trimmed = searchQuery.trim();
  const filterLower = searchQuery.toLowerCase();
  const filtered = userPresets.filter((p) => p.name.toLowerCase().includes(filterLower));

  const slateEmpty = slateKeys.length === 0;
  const presetMatched = matchedUserPreset !== null;
  const saveHidden = slateEmpty;
  const saveDisabled = presetMatched || trimmed.length === 0;

  const handleSave = () => {
    if (saveHidden || saveDisabled) return;
    onSave(trimmed, slateKeys);
    setSearchQuery('');
  };

  const handleApply = (presetId: string) => {
    onApply(presetId);
    setSearchQuery('');
  };

  return (
    <PopoverContent
      data-user-preset-popover
      side="bottom"
      align="center"
      className="w-80 max-w-[90vw] gap-3 bg-(--surface) ring-(--border-raw)"
    >
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        maxLength={40}
        placeholder="Search or name a new preset"
        aria-label="Search or name a new preset"
        className="w-full rounded-md border border-border/60 bg-(--surface-2) px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

      <PresetList
        presets={filtered}
        totalCount={userPresets.length}
        searchQuery={searchQuery}
        slateEmpty={slateEmpty}
        matchedUserPreset={matchedUserPreset}
        onApply={handleApply}
        onDelete={onDelete}
      />

      {!saveHidden && (
        <button
          type="button"
          disabled={saveDisabled}
          onClick={handleSave}
          className="w-full rounded-md border border-dashed border-border/70 bg-transparent px-3 py-2 text-sm text-foreground transition-colors hover:bg-(--accent-soft) disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          Save current as preset
        </button>
      )}
    </PopoverContent>
  );
});

interface PresetListProps {
  presets: readonly UserPreset[];
  totalCount: number;
  searchQuery: string;
  slateEmpty: boolean;
  matchedUserPreset: UserPreset | null;
  onApply: (presetId: string) => void;
  onDelete: (presetId: string) => void;
}

function PresetList({
  presets,
  totalCount,
  searchQuery,
  slateEmpty,
  matchedUserPreset,
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
          active={matchedUserPreset?.id === p.id}
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

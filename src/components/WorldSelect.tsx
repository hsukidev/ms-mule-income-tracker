import { Select } from '@base-ui/react/select';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useWorld } from '@/context/WorldProvider';
import { WORLDS, type World, type WorldGroup, type WorldId } from '@/data/worlds';

const WORLDS_BY_GROUP: ReadonlyArray<{ group: WorldGroup; worlds: readonly World[] }> = [
  { group: 'Heroic', worlds: WORLDS.filter((w) => w.group === 'Heroic') },
  { group: 'Interactive', worlds: WORLDS.filter((w) => w.group === 'Interactive') },
];

/**
 * Header World Select control. One trigger with responsive inner layout: a
 * soft chip at `≥sm` and an icon-only globe button at `<sm`. The panel groups
 * the six canonical worlds by **World Group** with right-aligned check
 * indicators on the selected row.
 */
export function WorldSelect() {
  const { world, setWorld } = useWorld();

  return (
    <Select.Root
      value={world?.id ?? null}
      onValueChange={(id) => {
        if (id) setWorld(id as WorldId);
      }}
    >
      <Select.Trigger
        aria-label="Select world"
        data-slot="world-select-trigger"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground cursor-pointer sm:size-auto sm:inline-flex sm:gap-1.5 sm:border sm:border-border sm:bg-(--surface-2) sm:px-2.5 sm:py-1 sm:text-xs sm:transition-colors sm:hover:border-(--accent-raw)"
      >
        <Globe size={16} aria-hidden="true" className="sm:hidden" />
        {world ? (
          <span className="hidden sm:inline">{world.label}</span>
        ) : (
          <span className="hidden sm:inline italic text-muted-foreground">Select world</span>
        )}
        <ChevronDown size={14} aria-hidden="true" className="hidden sm:inline-block" />
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner
          sideOffset={6}
          align="end"
          alignItemWithTrigger={false}
          className="isolate z-50 outline-hidden"
        >
          <Select.Popup
            data-slot="world-select-popup"
            className="min-w-44 rounded-lg bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden"
          >
            {WORLDS_BY_GROUP.map(({ group, worlds }) => (
              <Select.Group key={group}>
                <Select.GroupLabel className="block px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                  {group.toUpperCase()}
                </Select.GroupLabel>
                {worlds.map((w) => (
                  <WorldSelectItem key={w.id} id={w.id} label={w.label} />
                ))}
              </Select.Group>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function WorldSelectItem({ id, label }: { id: WorldId; label: string }) {
  return (
    <Select.Item
      value={id}
      className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm outline-hidden data-highlighted:bg-accent data-highlighted:text-accent-foreground"
    >
      <Select.ItemText>{label}</Select.ItemText>
      <Select.ItemIndicator className="ml-auto flex items-center">
        <Check size={14} aria-hidden="true" data-testid="world-select-check" />
      </Select.ItemIndicator>
    </Select.Item>
  );
}

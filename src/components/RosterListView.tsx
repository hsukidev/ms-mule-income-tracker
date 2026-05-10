import type { Mule } from '../types';
import { useMatchMedia } from '../hooks/useMatchMedia';
import type { RosterRowMetrics } from './rosterRowMetrics';
import { MuleListRow } from './MuleListRow';
import { AddCard } from './AddCard';

interface RosterListViewProps {
  mules: readonly Mule[];
  /** Per-mule metrics keyed by mule id. Built once at the Dashboard level so
   * Card and Row evaluate the **Contributing Mule** predicate against the
   * same numbers (see `Dashboard.metricsByMule`). Each mule in `mules` must
   * have a corresponding entry. */
  metricsByMule: ReadonlyMap<string, RosterRowMetrics>;
  onCardClick: (id: string) => void;
  bulkMode: boolean;
  toDelete: ReadonlySet<string>;
  onToggleSelect: (id: string) => void;
  onAddMule?: () => void;
  isPaintEngaged?: boolean;
}

export function RosterListView({
  mules,
  metricsByMule,
  onCardClick,
  bulkMode,
  toDelete,
  onToggleSelect,
  onAddMule,
  isPaintEngaged = false,
}: RosterListViewProps) {
  // Below 635px the row's income column is too narrow for unabbreviated meso.
  // Subscribe once at the roster level and prop-drill, so a 50-mule list
  // doesn't open 50 matchMedia listeners.
  const forceAbbreviated = useMatchMedia('(max-width: 634px)');

  return (
    <div data-testid="roster-list" style={{ display: 'grid', gap: 'var(--row-vgap, 8px)' }}>
      {mules.map((mule) => {
        const metrics = metricsByMule.get(mule.id)!;
        return (
          <MuleListRow
            key={mule.id}
            mule={mule}
            metrics={metrics}
            postCapIncomeMeso={metrics.postCapMeso}
            onClick={onCardClick}
            bulkMode={bulkMode}
            selected={toDelete.has(mule.id)}
            onToggleSelect={onToggleSelect}
            isPaintEngaged={isPaintEngaged}
            forceAbbreviated={forceAbbreviated}
          />
        );
      })}
      {!bulkMode && onAddMule && <AddCard onClick={onAddMule} />}
    </div>
  );
}

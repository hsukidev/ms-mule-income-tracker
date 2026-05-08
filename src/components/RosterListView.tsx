import { useMemo } from 'react';
import type { Mule } from '../types';
import type { WorldIncome } from '../modules/worldIncome';
import { rosterRowMetrics } from './rosterRowMetrics';
import { MuleListRow } from './MuleListRow';
import { AddCard } from './AddCard';

interface RosterListViewProps {
  mules: readonly Mule[];
  worldIncome: WorldIncome;
  onCardClick: (id: string) => void;
  bulkMode: boolean;
  toDelete: ReadonlySet<string>;
  onToggleSelect: (id: string) => void;
  onAddMule?: () => void;
  isPaintEngaged?: boolean;
}

export function RosterListView({
  mules,
  worldIncome,
  onCardClick,
  bulkMode,
  toDelete,
  onToggleSelect,
  onAddMule,
  isPaintEngaged = false,
}: RosterListViewProps) {
  const rowMetrics = useMemo(
    () =>
      mules.map((mule) => ({
        mule,
        metrics: rosterRowMetrics(
          mule,
          worldIncome.perMule.get(mule.id),
          worldIncome.totalContributedMeso,
        ),
      })),
    [mules, worldIncome.perMule, worldIncome.totalContributedMeso],
  );

  return (
    <div data-testid="roster-list" style={{ display: 'grid', gap: 'var(--row-vgap, 8px)' }}>
      {rowMetrics.map(({ mule, metrics }) => (
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
        />
      ))}
      {!bulkMode && onAddMule && <AddCard onClick={onAddMule} />}
    </div>
  );
}

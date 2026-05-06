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
  return (
    <div data-testid="roster-list" style={{ display: 'grid', gap: 'var(--row-vgap, 8px)' }}>
      {mules.map((mule) => {
        const contribution = worldIncome.perMule.get(mule.id);
        const metrics = rosterRowMetrics(mule, contribution, worldIncome.totalContributedMeso);
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
          />
        );
      })}
      {!bulkMode && onAddMule && <AddCard onClick={onAddMule} />}
    </div>
  );
}

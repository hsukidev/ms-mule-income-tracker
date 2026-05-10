import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { WorldIncome } from '../../modules/worldIncome';
import { rosterRowMetrics, type RosterRowMetrics } from '../rosterRowMetrics';
import { RosterListView } from '../RosterListView';
import type { Mule } from '../../types';

function makeMule(id: string, overrides: Partial<Mule> = {}): Mule {
  return {
    id,
    name: id.toUpperCase(),
    level: 200,
    muleClass: 'Hero',
    selectedBosses: [],
    active: true,
    ...overrides,
  };
}

function Harness({ initial }: { initial: Mule[] }) {
  const [order, setOrder] = useState(initial);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 0 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.findIndex((m) => m.id === active.id);
      const newIndex = order.findIndex((m) => m.id === over.id);
      const next = [...order];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      setOrder(next);
    }
  }
  const worldIncome = WorldIncome.of(order);
  const metricsByMule = new Map<string, RosterRowMetrics>(
    order.map((m) => [
      m.id,
      rosterRowMetrics(m, worldIncome.perMule.get(m.id), worldIncome.totalContributedMeso),
    ]),
  );
  return (
    <div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={order.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <RosterListView
            mules={order}
            metricsByMule={metricsByMule}
            onCardClick={vi.fn()}
            bulkMode={false}
            toDelete={new Set()}
            onToggleSelect={vi.fn()}
          />
        </SortableContext>
      </DndContext>
      <output data-testid="order">{order.map((m) => m.id).join(',')}</output>
    </div>
  );
}

describe('RosterListView — drag reorder', () => {
  it('renders one row per mule under the SortableContext', () => {
    const mules = [makeMule('a'), makeMule('b'), makeMule('c')];
    render(<Harness initial={mules} />);
    expect(screen.getByTestId('order').textContent).toBe('a,b,c');
    expect(screen.getByTestId('mule-row-a')).toBeTruthy();
    expect(screen.getByTestId('mule-row-b')).toBeTruthy();
    expect(screen.getByTestId('mule-row-c')).toBeTruthy();
  });

  it('rows expose a [data-mule-row] hook (the sortable handle anchor)', () => {
    const mules = [makeMule('a'), makeMule('b')];
    const { container } = render(<Harness initial={mules} />);
    const rows = container.querySelectorAll('[data-mule-row]');
    expect(rows.length).toBe(2);
    // Order in the DOM matches the order array.
    expect(rows[0].getAttribute('data-mule-row')).toBe('a');
    expect(rows[1].getAttribute('data-mule-row')).toBe('b');
  });
});

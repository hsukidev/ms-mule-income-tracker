import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MuleListRow } from '../MuleListRow';
import { bosses } from '../../data/bosses';
import type { Mule } from '../../types';
import type { RosterRowMetrics } from '../rosterRowMetrics';

const LUCID = bosses.find((b) => b.family === 'lucid')!.id;
const HARD_LUCID = `${LUCID}:hard:weekly`;

const baseMule: Mule = {
  id: 'row-mule-1',
  name: 'RowMule',
  level: 250,
  muleClass: 'Hero',
  selectedBosses: [],
  active: true,
};

const baseMetrics: RosterRowMetrics = {
  weeklyCount: 8,
  dailyCount: 3,
  postCapMeso: 1_500_000_000,
  sharePct: 0.095,
  droppedKeys: new Map(),
};

interface RenderRowOpts {
  mule?: Partial<Mule>;
  metrics?: Partial<RosterRowMetrics>;
  onClick?: (id: string) => void;
  bulkMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

function renderRow(opts: RenderRowOpts = {}) {
  const onClick = opts.onClick ?? vi.fn();
  const onToggleSelect = opts.onToggleSelect ?? vi.fn();
  const mule: Mule = { ...baseMule, ...opts.mule };
  const metrics: RosterRowMetrics = { ...baseMetrics, ...opts.metrics };
  return {
    ...render(
      <DndContext>
        <SortableContext items={[mule.id]} strategy={verticalListSortingStrategy}>
          <MuleListRow
            mule={mule}
            metrics={metrics}
            postCapIncomeMeso={metrics.postCapMeso}
            onClick={onClick}
            bulkMode={opts.bulkMode ?? false}
            selected={opts.selected ?? false}
            onToggleSelect={onToggleSelect}
          />
        </SortableContext>
      </DndContext>,
    ),
    onClick,
    onToggleSelect,
    mule,
  };
}

describe('MuleListRow — comfy spec', () => {
  it('renders the mule name', () => {
    renderRow();
    expect(screen.getByText('RowMule')).toBeTruthy();
  });

  it('renders the mule class label', () => {
    renderRow();
    expect(screen.getByText('Hero')).toBeTruthy();
  });

  it('renders Lv.N pill', () => {
    renderRow();
    expect(screen.getByText('Lv.250')).toBeTruthy();
  });

  it('renders WEEKLY eyebrow with N/14', () => {
    renderRow();
    expect(screen.getByText(/weekly/i)).toBeTruthy();
    // The fraction may be split between accent + muted spans; assert against
    // the row's text content.
    const row = screen.getByTestId('mule-row-row-mule-1');
    expect(row.textContent).toMatch(/8\s*\/\s*14/);
  });

  it('renders DAILY eyebrow with bare N (no denominator)', () => {
    renderRow();
    expect(screen.getByText(/daily/i)).toBeTruthy();
    const row = screen.getByTestId('mule-row-row-mule-1');
    // Daily count is 3; the daily column should contain just `3` with no
    // `/<denominator>` suffix.
    expect(row.textContent).toMatch(/DAILY[\s\S]*3/);
    // Belt-and-suspenders: a `3/7`-style daily fraction would imply a
    // denominator we don't want.
    expect(row.textContent).not.toMatch(/3\s*\/\s*7/);
  });

  it('renders the post-cap income figure (abbreviated by default)', () => {
    renderRow();
    expect(screen.getByText('1.5B')).toBeTruthy();
  });

  it('renders a share-of-roster percentage', () => {
    renderRow();
    const row = screen.getByTestId('mule-row-row-mule-1');
    expect(row.textContent).toMatch(/9\.5%\s*SHARE/);
  });

  it('renders the CharacterAvatar (data-testid=card-avatar)', () => {
    renderRow();
    expect(screen.getByTestId('card-avatar')).toBeTruthy();
  });

  it('calls onClick(mule.id) when the row is clicked', () => {
    const { onClick } = renderRow();
    fireEvent.click(screen.getByText('RowMule'));
    expect(onClick).toHaveBeenCalledWith('row-mule-1');
  });

  it('renders an active mule at opacity 1 and inactive at 0.55', () => {
    const { container } = renderRow();
    const row = container.querySelector('[data-mule-row]') as HTMLElement;
    expect(row.style.opacity).toBe('1');
  });

  it('renders an inactive mule at 0.55 opacity', () => {
    const { container } = renderRow({ mule: { active: false } });
    const row = container.querySelector('[data-mule-row]') as HTMLElement;
    expect(row.style.opacity).toBe('0.55');
  });
});

describe('MuleListRow — bulk mode', () => {
  it('replaces the grip with a destructive checkbox when bulkMode = true', () => {
    const { container } = renderRow({ bulkMode: true });
    const indicator = container.querySelector('[data-selection-indicator]') as HTMLElement;
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute('aria-hidden')).not.toBeNull();
    // Row should not show the grip when bulk mode is on (the leftmost slot
    // is now the checkbox).
    const grip = container.querySelector('[data-mule-row-grip]');
    expect(grip).toBeNull();
  });

  it('selected row picks up destructive border + soft destructive bg', () => {
    const { container } = renderRow({ bulkMode: true, selected: true });
    const row = container.querySelector('[data-mule-row]') as HTMLElement;
    const compound = row.style.borderColor + row.style.background;
    expect(compound).toMatch(/destructive/);
  });

  it('clicking the row in bulk mode fires onToggleSelect (not onClick)', () => {
    const onClick = vi.fn();
    const onToggleSelect = vi.fn();
    renderRow({ bulkMode: true, onClick, onToggleSelect });
    fireEvent.click(screen.getByText('RowMule'));
    expect(onToggleSelect).toHaveBeenCalledWith('row-mule-1');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('selected row shows the check icon inside the indicator', () => {
    const { container } = renderRow({ bulkMode: true, selected: true });
    const indicator = container.querySelector('[data-selection-indicator]') as HTMLElement;
    expect(indicator.querySelector('svg')).toBeTruthy();
  });
});

describe('MuleListRow — notes indicator', () => {
  const ICON = /show character notes/i;

  it('does not render the notes icon when notes are empty', () => {
    renderRow({ mule: { notes: undefined } });
    expect(screen.queryByRole('button', { name: ICON })).toBeNull();
  });

  it('does not render the notes icon when notes are whitespace-only', () => {
    renderRow({ mule: { notes: '  \n\t ' } });
    expect(screen.queryByRole('button', { name: ICON })).toBeNull();
  });

  it('renders the notes icon next to the name when notes are non-empty', () => {
    renderRow({ mule: { notes: 'main mule, owes legion levels' } });
    const icon = screen.getByRole('button', { name: ICON });
    expect(icon).toBeTruthy();
  });

  it('does not render the notes icon in bulk mode', () => {
    renderRow({ mule: { notes: 'note' }, bulkMode: true });
    expect(screen.queryByRole('button', { name: ICON })).toBeNull();
  });

  it('clicking the notes icon does not invoke the row onClick', () => {
    const onClick = vi.fn();
    renderRow({ mule: { notes: 'note' }, onClick });
    fireEvent.click(screen.getByRole('button', { name: ICON }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('MuleListRow — narrow-width tap tooltips on metric values', () => {
  it('weekly value is wrapped in a Tooltip whose trigger names the metric', () => {
    renderRow();
    const trigger = screen.getByRole('button', { name: /weekly count/i });
    expect(trigger).toBeTruthy();
  });

  it('daily value is wrapped in a Tooltip whose trigger names the metric', () => {
    renderRow();
    expect(screen.getByRole('button', { name: /daily count/i })).toBeTruthy();
  });

  it('share value is wrapped in a Tooltip whose trigger names the metric', () => {
    renderRow();
    expect(screen.getByRole('button', { name: /share of roster/i })).toBeTruthy();
  });

  it('eyebrow labels are tagged with [data-row-eyebrow] so the <480px media rule can hide them', () => {
    const { container } = renderRow();
    expect(container.querySelectorAll('[data-row-eyebrow]').length).toBeGreaterThanOrEqual(3);
  });

  it('clicking a metric tooltip trigger does not invoke the row onClick', () => {
    const onClick = vi.fn();
    renderRow({ onClick });
    fireEvent.click(screen.getByRole('button', { name: /weekly count/i }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('MuleListRow — dropped-cap indicator', () => {
  const ICON = /show bosses dropped to cap/i;

  it('does not render the icon when droppedKeys is empty', () => {
    renderRow();
    expect(screen.queryByRole('button', { name: ICON })).toBeNull();
  });

  it('renders the icon when droppedKeys has entries', () => {
    const droppedKeys = new Map([[HARD_LUCID, 1]]);
    renderRow({ metrics: { droppedKeys } });
    expect(screen.getByRole('button', { name: ICON })).toBeTruthy();
  });

  it('does not render the icon in bulk mode regardless of droppedKeys', () => {
    const droppedKeys = new Map([[HARD_LUCID, 1]]);
    renderRow({ metrics: { droppedKeys }, bulkMode: true });
    expect(screen.queryByRole('button', { name: ICON })).toBeNull();
  });

  it('clicking the dropped-cap icon does not invoke the row onClick', () => {
    const onClick = vi.fn();
    const droppedKeys = new Map([[HARD_LUCID, 1]]);
    renderRow({ metrics: { droppedKeys }, onClick });
    fireEvent.click(screen.getByRole('button', { name: ICON }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

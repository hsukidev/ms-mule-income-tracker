/// <reference types="node" />
/**
 * Pins the row-grain layout contract for the List view:
 *   - `[data-density='comfy']` defines `--row-pad: 14px 18px`, `--row-avatar: 44px`,
 *     `--row-gap: 10px`.
 *   - `[data-density='compact']` defines `--row-pad: 8px 14px`, `--row-avatar: 36px`,
 *     `--row-gap: 6px`.
 *   - The MuleListRow style references all three CSS vars by name, so the
 *     density-scope rules are what actually drive the visual difference.
 *
 * jsdom has no layout engine — we follow the same approach as
 * RosterLayoutContract: regex over `index.css` for the variable assertions and
 * inline-style checks on the rendered row.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from '../../test/test-utils';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MuleListRow } from '../MuleListRow';
import type { Mule } from '../../types';
import type { RosterRowMetrics } from '../rosterRowMetrics';

const indexCssRaw = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf-8');

const baseMule: Mule = {
  id: 'contract-mule',
  name: 'C',
  level: 200,
  muleClass: 'Hero',
  selectedBosses: [],
  active: true,
};

const baseMetrics: RosterRowMetrics = {
  weeklyCount: 0,
  dailyCount: 0,
  postCapMeso: 0,
  sharePct: 0,
  droppedKeys: new Map(),
};

function rowVarFor(scope: 'comfy' | 'compact', name: string): string {
  // Match the LAST occurrence inside the density block so phone-mode overrides
  // (which append at the end) don't leak in via greedy matching.
  const re = new RegExp(
    String.raw`\[data-density=['"]${scope}['"]\]\s*\{[^}]*?--${name}:\s*([^;]+);`,
    'm',
  );
  const m = indexCssRaw.match(re);
  if (!m) throw new Error(`Could not find --${name} for ${scope} in index.css`);
  return m[1].trim();
}

describe('Roster list layout contract — density tightens row vars', () => {
  it('comfy declares --row-pad: 14px 18px', () => {
    expect(rowVarFor('comfy', 'row-pad')).toBe('14px 18px');
  });

  it('compact declares --row-pad: 8px 14px', () => {
    expect(rowVarFor('compact', 'row-pad')).toBe('8px 14px');
  });

  it('comfy declares --row-avatar: 44px', () => {
    expect(rowVarFor('comfy', 'row-avatar')).toBe('44px');
  });

  it('compact declares --row-avatar: 36px', () => {
    expect(rowVarFor('compact', 'row-avatar')).toBe('36px');
  });

  it('comfy declares --row-gap: 10px', () => {
    expect(rowVarFor('comfy', 'row-gap')).toBe('10px');
  });

  it('compact declares --row-gap: 6px', () => {
    expect(rowVarFor('compact', 'row-gap')).toBe('6px');
  });
});

describe('MuleListRow inline styles reference the density-scoped row vars', () => {
  it('row padding uses var(--row-pad)', () => {
    const { container } = render(
      <DndContext>
        <SortableContext items={[baseMule.id]} strategy={verticalListSortingStrategy}>
          <MuleListRow
            mule={baseMule}
            metrics={baseMetrics}
            postCapIncomeMeso={0}
            onClick={() => {}}
          />
        </SortableContext>
      </DndContext>,
    );
    const row = container.querySelector('[data-mule-row]') as HTMLElement;
    // jsdom preserves the inline style as-written.
    expect(row.style.padding).toContain('var(--row-pad');
  });

  it('row gap uses var(--row-gap)', () => {
    const { container } = render(
      <DndContext>
        <SortableContext items={[baseMule.id]} strategy={verticalListSortingStrategy}>
          <MuleListRow
            mule={baseMule}
            metrics={baseMetrics}
            postCapIncomeMeso={0}
            onClick={() => {}}
          />
        </SortableContext>
      </DndContext>,
    );
    const row = container.querySelector('[data-mule-row]') as HTMLElement;
    expect(row.style.gap).toContain('var(--row-gap');
  });

  it('row grid template references var(--row-avatar) for the avatar column', () => {
    const { container } = render(
      <DndContext>
        <SortableContext items={[baseMule.id]} strategy={verticalListSortingStrategy}>
          <MuleListRow
            mule={baseMule}
            metrics={baseMetrics}
            postCapIncomeMeso={0}
            onClick={() => {}}
          />
        </SortableContext>
      </DndContext>,
    );
    const row = container.querySelector('[data-mule-row]') as HTMLElement;
    expect(row.style.gridTemplateColumns).toContain('var(--row-avatar');
  });
});

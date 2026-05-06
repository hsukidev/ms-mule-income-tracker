import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { renderApp, screen } from '@/test/test-utils';
import type { Mule } from '../types';
import {
  enterBulk,
  mockElementFromPointSlots,
  pointerDown,
  pointerMove,
  pointerUp,
  resetBulkPaintEnvironment,
  seedMules,
} from './helpers/bulkDragPaintHarness';

const testMules: Mule[] = [
  {
    id: 'mule-a',
    name: 'Alpha',
    level: 200,
    muleClass: 'Hero',
    selectedBosses: [],
    active: true,
    worldId: 'heroic-kronos',
  },
  {
    id: 'mule-b',
    name: 'Beta',
    level: 180,
    muleClass: 'Paladin',
    selectedBosses: [],
    active: true,
    worldId: 'heroic-kronos',
  },
  {
    id: 'mule-c',
    name: 'Gamma',
    level: 160,
    muleClass: 'Dark Knight',
    selectedBosses: [],
    active: true,
    worldId: 'heroic-kronos',
  },
];

const ROW_STRIDE = 70;
const ROW_SPAN = 60;

function rowCenterY(idx: number): number {
  return idx * ROW_STRIDE + ROW_SPAN / 2;
}

describe('useBulkDragPaint — list view wiring', () => {
  let restoreHitTest: (() => void) | null = null;

  beforeEach(() => {
    resetBulkPaintEnvironment({ display: 'list' });
  });

  afterEach(() => {
    if (restoreHitTest) {
      restoreHitTest();
      restoreHitTest = null;
    }
  });

  it('forward paint across three rows marks all three as Deletion-Marked', async () => {
    seedMules(testMules);
    const { container } = await renderApp();
    // Sanity: the roster-list testid only renders through RosterListView.
    expect(container.querySelector('[data-testid="roster-list"]')).toBeTruthy();

    enterBulk();
    restoreHitTest = mockElementFromPointSlots(container, testMules, {
      axis: 'y',
      stride: ROW_STRIDE,
      span: ROW_SPAN,
    });

    const rowA = container.querySelector('[data-paint-target="mule-a"]') as HTMLElement | null;
    expect(rowA).toBeTruthy();

    pointerDown(rowA!, 200, rowCenterY(0));
    pointerMove(document, 200, rowCenterY(1));
    pointerMove(document, 200, rowCenterY(2));
    pointerUp(document, 200, rowCenterY(2));

    expect(screen.getByText(/3\s*SELECTED/i)).toBeTruthy();
  });
});

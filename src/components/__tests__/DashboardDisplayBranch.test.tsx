/// <reference types="node" />
/**
 * Pins the `Dashboard` display-mode branching:
 *   - `display === 'cards'`: the existing card grid is the only roster body
 *     (no `[data-testid=roster-list]`).
 *   - `display === 'list'`: the cards disappear and a `[data-testid=roster-list]`
 *     container renders one descendant per mule.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { renderApp } from '../../test/test-utils';
import type { Mule } from '../../types';

const STORAGE_KEY = 'maplestory-mule-tracker';

function persistedRoot(mules: Mule[]) {
  return { schemaVersion: 2, mules };
}

function seedMules(mules: Mule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedRoot(mules)));
}

let muleCounter = 0;
function makeMule(overrides: Partial<Mule> = {}): Mule {
  muleCounter += 1;
  return {
    id: `mule-${muleCounter}`,
    name: `Mule${muleCounter}`,
    level: 200,
    muleClass: 'Hero',
    selectedBosses: [],
    active: true,
    worldId: 'heroic-kronos',
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-density');
  document.documentElement.removeAttribute('data-display');
  localStorage.setItem('world', 'heroic-kronos');
});

describe('Dashboard display-mode branch', () => {
  it('renders the card grid (and no roster-list) when display = cards', async () => {
    seedMules([makeMule({ id: 'a' }), makeMule({ id: 'b' })]);
    const { container } = await renderApp();
    expect(container.querySelectorAll('[data-mule-card]').length).toBe(2);
    expect(container.querySelector('[data-testid=roster-list]')).toBeNull();
  });

  it('renders the roster-list (and no cards) when display = list', async () => {
    localStorage.setItem('display', 'list');
    seedMules([makeMule({ id: 'a' }), makeMule({ id: 'b' }), makeMule({ id: 'c' })]);
    const { container } = await renderApp();
    expect(container.querySelector('[data-mule-card]')).toBeNull();
    const list = container.querySelector('[data-testid=roster-list]') as HTMLElement;
    expect(list).toBeTruthy();
    // One descendant slot per mule (we'll let the slice-5 row fill the slot).
    expect(list.querySelectorAll('[data-mule-row]').length).toBe(3);
  });
});

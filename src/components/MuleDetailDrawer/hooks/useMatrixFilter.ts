import { useMemo, useState } from 'react';
import type { MuleBossSlate, SlateFamily } from '../../../data/muleBossSlate';
import type { CadenceFilter } from '../../MatrixToolbar';

/**
 * Narrow `SlateFamily[]` to families whose rows include at least one row with
 * the requested cadence. Applied post-`slate.view(search)` so the cadence
 * filter composes with the search filter without reshaping slate internals.
 */
function filterFamiliesByCadence(families: SlateFamily[], filter: CadenceFilter): SlateFamily[] {
  if (filter === 'All') return families;
  const cadence = filter === 'Weekly' ? 'weekly' : 'daily';
  return families.filter((f) => f.rows.some((r) => r.cadence === cadence));
}

/**
 * Owns the **Boss Search** + **Cadence Filter** composition for the drawer's
 * Boss Matrix view.
 *
 * - `search` / `setSearch` and `filter` / `setFilter` are local state.
 * - `visibleBosses` is the cadence filter composed onto `slate.view(search)`,
 *   with the **Black Mage** family excluded (it's monthly-only and hidden
 *   from the Matrix UI).
 * - `search` and `filter` auto-reset on **Mule Switch** via the React-supported
 *   render-time "store info from previous renders" pattern, so opening the
 *   drawer on a new mule starts with a fresh filter state.
 */
export function useMatrixFilter({
  muleId,
  slate,
}: {
  muleId: string | null;
  slate: MuleBossSlate;
}): {
  search: string;
  setSearch: (s: string) => void;
  filter: CadenceFilter;
  setFilter: (f: CadenceFilter) => void;
  visibleBosses: SlateFamily[];
} {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CadenceFilter>('All');

  const [lastMuleId, setLastMuleId] = useState<string | null>(muleId);
  if (lastMuleId !== muleId) {
    setLastMuleId(muleId);
    setSearch('');
    setFilter('All');
  }

  const visibleBosses = useMemo(
    () =>
      filterFamiliesByCadence(slate.view(search), filter).filter((f) => f.family !== 'black-mage'),
    [slate, search, filter],
  );

  return { search, setSearch, filter, setFilter, visibleBosses };
}

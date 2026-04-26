import { useCallback, useMemo } from 'react';
import type { Mule } from '../../../types';

const PARTY_SIZE_MIN = 1;
const PARTY_SIZE_MAX = 6;

/**
 * Owns the **Party-Size Clamp** [1, 6] write path and the `stablePartySizes`
 * memo that keeps the prop's identity stable across renders, so `BossMatrix`
 * can rely on referential equality for its `partySizes` map.
 *
 * `setPartySize` no-ops when `muleId === null` (drawer open with no mule).
 */
export function usePartySizes({
  muleId,
  partySizes,
  onUpdate,
}: {
  muleId: string | null;
  partySizes: Mule['partySizes'];
  onUpdate: (id: string, patch: Partial<Omit<Mule, 'id'>>) => void;
}): {
  stablePartySizes: Record<string, number>;
  setPartySize: (family: string, n: number) => void;
} {
  const stablePartySizes = useMemo(() => partySizes ?? {}, [partySizes]);

  const setPartySize = useCallback(
    (family: string, n: number) => {
      if (!muleId) return;
      const clamped = Math.max(PARTY_SIZE_MIN, Math.min(PARTY_SIZE_MAX, n));
      onUpdate(muleId, {
        partySizes: { ...stablePartySizes, [family]: clamped },
      });
    },
    [muleId, stablePartySizes, onUpdate],
  );

  return { stablePartySizes, setPartySize };
}

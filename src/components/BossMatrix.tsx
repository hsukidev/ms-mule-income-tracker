import type { BossTier } from '../types';
import { bosses } from '../data/bosses';
import { makeKey, parseKey, TIER_ORDER } from '../data/bossSelection';
import { formatMeso } from '../utils/meso';

/**
 * Pip colour per lowercase tier. Relocated from the now-deleted
 * `BossCheckboxList`; keyed by lowercase `BossTier` so the Matrix can
 * colour its header pips without round-tripping through the capitalized
 * `BossDifficultyLabel`.
 */
const TIER_COLOR: Record<BossTier, string> = {
  easy: '#6fb878',
  normal: '#8fb3d9',
  hard: '#d98a3a',
  chaos: '#c94f8f',
  extreme: '#e8533a',
};

const TIER_HEADER_LABEL: Record<BossTier, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  chaos: 'Chaos',
  extreme: 'Extreme',
};

interface BossMatrixProps {
  selectedKeys: string[];
  onToggleKey: (key: string) => void;
}

// Sort families once at module load — top-tier crystalValue descending.
const familyTopCrystal = new Map<string, number>(
  bosses.map((b) => [b.id, Math.max(...b.difficulty.map((d) => d.crystalValue))]),
);
const sortedBosses = bosses
  .slice()
  .sort((a, b) => familyTopCrystal.get(b.id)! - familyTopCrystal.get(a.id)!);

function TierHeader({ tier }: { tier: BossTier }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span
        aria-hidden
        data-difficulty-pip={tier}
        style={{
          width: 4,
          height: 14,
          borderRadius: 2,
          background: TIER_COLOR[tier],
          display: 'inline-block',
        }}
      />
      <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[var(--muted-raw,var(--muted-foreground))]">
        {TIER_HEADER_LABEL[tier]}
      </span>
    </div>
  );
}

export function BossMatrix({ selectedKeys, onToggleKey }: BossMatrixProps) {
  const selectedSet = new Set(selectedKeys);
  // bossId → selected tier for that family (undefined means nothing selected).
  const selectedTierByBoss = new Map<string, BossTier>();
  for (const key of selectedKeys) {
    const parsed = parseKey(key);
    if (parsed) selectedTierByBoss.set(parsed.bossId, parsed.tier);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="table"
        className="rounded-lg border border-border/50 overflow-hidden"
        style={{ background: 'var(--surface-2)' }}
      >
        <div
          role="row"
          className="grid border-b border-border/50"
          style={{ gridTemplateColumns: '1.6fr repeat(5, 1fr)' }}
        >
          <div
            role="columnheader"
            className="px-3 py-2 font-sans text-[10px] uppercase tracking-[0.22em] text-[var(--muted-raw,var(--muted-foreground))]"
          >
            Boss Family
          </div>
          {TIER_ORDER.map((tier) => (
            <div
              key={tier}
              role="columnheader"
              aria-label={TIER_HEADER_LABEL[tier]}
              className="px-2 py-2"
            >
              <TierHeader tier={tier} />
            </div>
          ))}
        </div>

        {sortedBosses.map((boss) => {
          const selectedTier = selectedTierByBoss.get(boss.id);
          const tierMap = new Map(boss.difficulty.map((d) => [d.tier, d]));
          return (
            <div
              key={boss.id}
              role="row"
              className="grid border-b border-border/40 last:border-b-0"
              style={{ gridTemplateColumns: '1.6fr repeat(5, 1fr)' }}
            >
              <div
                role="rowheader"
                className="px-3 py-2 font-display text-sm font-semibold truncate"
              >
                {boss.name}
              </div>
              {TIER_ORDER.map((tier) => {
                const diff = tierMap.get(tier);
                if (!diff) {
                  return (
                    <div
                      key={tier}
                      role="cell"
                      data-testid={`matrix-cell-${boss.id}-${tier}`}
                      aria-disabled="true"
                      className="px-2 py-2 flex items-center justify-center font-mono-nums text-[11px] text-[var(--muted-raw,var(--muted-foreground))]"
                      style={{ cursor: 'default', opacity: 0.3 }}
                    >
                      —
                    </div>
                  );
                }

                const key = makeKey(boss.id, tier);
                const isSelected = selectedSet.has(key);
                const isDim = selectedTier !== undefined && !isSelected;

                const classes = [
                  'px-2 py-2 flex items-center justify-center font-mono-nums text-[11px] tabular-nums cursor-pointer transition-colors border-l border-border/30',
                  isSelected
                    ? 'bg-[var(--accent-soft)] ring-1 ring-inset ring-[var(--accent)] text-[var(--accent)] font-semibold'
                    : 'text-[var(--muted-raw,var(--muted-foreground))] hover:bg-[var(--surface-2)] hover:text-[var(--text,var(--foreground))]',
                ].join(' ');

                return (
                  <button
                    type="button"
                    key={tier}
                    role="cell"
                    data-testid={`matrix-cell-${boss.id}-${tier}`}
                    data-state={isSelected ? 'on' : 'off'}
                    data-dim={isDim ? 'true' : undefined}
                    onClick={() => onToggleKey(key)}
                    className={classes}
                    style={isDim ? { opacity: 0.35 } : undefined}
                  >
                    {formatMeso(diff.crystalValue, true)}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <p className="font-display italic text-xs text-[var(--muted-raw,var(--muted-foreground))]">
        Tap a cell to pick difficulty.
      </p>
    </div>
  );
}

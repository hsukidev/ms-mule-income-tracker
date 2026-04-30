import { useCountUp } from '../hooks/useCountUp';

interface WeeklyCapRailProps {
  crystalTotal: number;
  cap: number;
}

// Bar width AND displayed percent both clamp at 100%; only the raw count reveals
// overflow (e.g. "185 / 180 · 100%" with bar full). The fill width and percent
// text are driven from the same useCountUp source so they stay in lockstep —
// including the one-time mount entrance from 0%.
export function WeeklyCapRail({ crystalTotal, cap }: WeeklyCapRailProps) {
  const rawPct = cap > 0 ? (crystalTotal / cap) * 100 : 0;
  const clampedPct = Math.min(100, rawPct);
  const animatedPct = useCountUp(clampedPct, 600);
  const displayPct = Math.round(animatedPct);
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span className="eyebrow-plain">WEEKLY CAP</span>
        <span
          className="kpi-meta"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
        >
          <span style={{ color: 'var(--accent-raw, var(--accent))', fontWeight: 600 }}>
            {crystalTotal}
          </span>
          <span style={{ color: 'var(--muted-raw, var(--muted-foreground))' }}>
            {' / '}
            {cap}
            {' · '}
            {displayPct}%
          </span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Weekly crystal cap"
        aria-valuenow={Math.round(clampedPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: 8,
          background: 'var(--surface-2, var(--secondary))',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${animatedPct}%`,
            background: 'var(--accent-raw, var(--accent))',
            borderRadius: 4,
            transition: 'width 200ms ease',
          }}
        />
      </div>
    </div>
  );
}

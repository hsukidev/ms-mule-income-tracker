import { useEffect, useState } from 'react';
import { formatCountdown, nextWeeklyResetUtc } from '../utils/resetCountdown';

// Reset Countdown widget: ticks once per second and displays the time remaining
// until the next Reset Anchor (Thursday 00:00 UTC). Desktop (>= sm) renders the
// Live Countdown Format; below sm switches to the Smart Countdown Format. The
// "RESET IN" label is always rendered at every viewport width.
export function ResetCountdown({ align = 'left' }: { align?: 'left' | 'right' } = {}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = nextWeeklyResetUtc(now) - now;
  const valueStyle = { color: 'var(--text, var(--foreground))' };

  const alignStyle = align === 'right' ? { textAlign: 'right' as const } : {};

  return (
    <div className="eyebrow-plain" style={{ opacity: 0.7, ...alignStyle }}>
      RESET IN{' '}
      <span className="hidden sm:inline" style={valueStyle}>
        {formatCountdown(remaining, 'live')}
      </span>
      <span className="sm:hidden" style={valueStyle}>
        {formatCountdown(remaining, 'smart')}
      </span>
    </div>
  );
}

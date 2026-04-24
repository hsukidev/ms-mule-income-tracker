import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMatchMedia } from '../hooks/useMatchMedia';
import { formatCountdown, nextWeeklyResetUtc } from '../utils/resetCountdown';

const VERY_NARROW_QUERY = '(max-width: 319.99px)';

// Reset Countdown widget: ticks once per second and displays the time remaining
// until the next Reset Anchor (Thursday 00:00 UTC). Desktop (>= sm) renders the
// Live Countdown Format; below sm switches to the Smart Countdown Format. Below
// 320px the "RESET IN" label is dropped and the timer becomes a tooltip
// trigger labelled "Weekly reset timer".
export function ResetCountdown({ align = 'left' }: { align?: 'left' | 'right' } = {}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isVeryNarrow = useMatchMedia(VERY_NARROW_QUERY);

  const [tipOpen, setTipOpen] = useState(false);

  const remaining = nextWeeklyResetUtc(now) - now;
  const valueStyle = { color: 'var(--text, var(--foreground))' };

  const alignStyle = align === 'right' ? { textAlign: 'right' as const } : {};

  if (isVeryNarrow) {
    return (
      <div style={alignStyle}>
        <Tooltip open={tipOpen} onOpenChange={setTipOpen}>
          <TooltipTrigger
            aria-label="Weekly reset timer"
            closeOnClick={false}
            onClick={() => setTipOpen(true)}
            className="eyebrow-plain cursor-pointer"
            style={{
              opacity: 0.7,
              background: 'none',
              border: 'none',
              padding: 0,
              ...valueStyle,
            }}
          >
            {formatCountdown(remaining, 'smart')}
          </TooltipTrigger>
          <TooltipContent className="px-3.5 py-2.5">WEEKLY RESET</TooltipContent>
        </Tooltip>
      </div>
    );
  }

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

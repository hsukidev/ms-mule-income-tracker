import { memo } from 'react';
import { Check } from 'lucide-react';

interface SelectionIndicatorProps {
  selected: boolean;
}

const DESTRUCTIVE = 'var(--destructive)';
const destructiveAlpha = (pct: number) =>
  `color-mix(in oklab, var(--destructive) ${pct}%, transparent)`;

export const SelectionIndicator = memo(function SelectionIndicator({
  selected,
}: SelectionIndicatorProps) {
  return (
    <span
      aria-hidden
      data-selection-indicator
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        border: `1.5px solid ${selected ? DESTRUCTIVE : destructiveAlpha(50)}`,
        background: selected ? DESTRUCTIVE : 'transparent',
        color: selected ? 'white' : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 140ms, border-color 140ms',
      }}
    >
      {selected && <Check style={{ width: 14, height: 14, strokeWidth: 3 }} />}
    </span>
  );
});

import { LayoutGrid, List } from 'lucide-react';
import { useDisplay } from '../context/DisplayProvider';

const OPTIONS: ReadonlyArray<{
  value: 'cards' | 'list';
  Icon: typeof LayoutGrid;
}> = [
  { value: 'cards', Icon: LayoutGrid },
  { value: 'list', Icon: List },
];

export function DisplayToggle() {
  const { display, toggleDisplay } = useDisplay();
  const next = display === 'cards' ? 'list' : 'cards';
  return (
    <div
      data-testid="display-toggle"
      data-display={display}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 4,
        background: 'var(--surface)',
        display: 'inline-flex',
      }}
    >
      {OPTIONS.map(({ value, Icon }) => {
        const isActive = display === value;
        return (
          <button
            key={value}
            type="button"
            data-value={value}
            aria-label={`Switch to ${next} view`}
            aria-pressed={isActive}
            onClick={toggleDisplay}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              fontFamily: 'Geist Mono, monospace',
              border: 'none',
              cursor: 'pointer',
              background: isActive ? 'var(--accent-soft)' : 'transparent',
              color: isActive
                ? 'var(--accent-raw, var(--accent))'
                : 'var(--muted-raw, var(--muted-foreground))',
              transition: 'background 120ms, color 120ms',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={14} strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}

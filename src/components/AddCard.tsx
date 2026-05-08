import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDisplay } from '../context/DisplayProvider';
import { ROSTER_CARD_ASPECT, ROSTER_CARD_MIN_HEIGHT } from './rosterCardContract';

interface AddCardProps {
  onClick: () => void;
}

export function AddCard({ onClick }: AddCardProps) {
  const { display } = useDisplay();
  const [isHovered, setIsHovered] = useState(false);

  const sharedHandlers = {
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  if (display === 'list') {
    return (
      <div
        data-add-row
        role="button"
        tabIndex={0}
        aria-label="Add mule"
        {...sharedHandlers}
        style={{
          padding: 'var(--row-pad, 14px 18px)',
          borderRadius: 10,
          border: '2px dashed',
          borderColor: isHovered ? 'var(--accent-raw, var(--accent))' : 'var(--border)',
          background: isHovered ? 'var(--accent-soft)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          minHeight: 'var(--row-height, 92px)',
          color: isHovered
            ? 'var(--accent-raw, var(--accent))'
            : 'var(--muted-raw, var(--muted-foreground))',
          fontSize: 'var(--row-name-size, 16px)',
          fontWeight: 600,
          transition: 'border-color 150ms, background 150ms, color 150ms',
        }}
      >
        <Plus
          aria-hidden
          style={{
            width: '1.1em',
            height: '1.1em',
            display: 'block',
            transform: 'translateY(-0.06em)',
          }}
          strokeWidth={2.25}
        />
        <span style={{ lineHeight: 1, display: 'block' }}>Add Mule</span>
      </div>
    );
  }

  return (
    <div
      data-add-card
      role="button"
      tabIndex={0}
      aria-label="Add mule"
      {...sharedHandlers}
      style={{
        padding: 'var(--card-pad, 16px)',
        borderRadius: 'var(--radius, 14px)',
        border: '2px dashed',
        borderColor: isHovered ? 'var(--accent-raw, var(--accent))' : 'var(--border)',
        background: isHovered ? 'var(--accent-soft)' : 'transparent',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        transition: 'border-color 150ms, background 150ms, color 150ms',
        minHeight: ROSTER_CARD_MIN_HEIGHT,
        aspectRatio: ROSTER_CARD_ASPECT,
        color: isHovered
          ? 'var(--accent-raw, var(--accent))'
          : 'var(--muted-raw, var(--muted-foreground))',
        fontSize: 'var(--row-name-size, 16px)',
        fontWeight: 600,
      }}
    >
      <div style={{ display: 'grid', placeItems: 'center', gap: 10 }}>
        <Plus
          aria-hidden
          style={{ width: '1.6em', height: '1.6em', display: 'block' }}
          strokeWidth={2.25}
        />
        <span style={{ lineHeight: 1, display: 'block' }}>Add Mule</span>
      </div>
    </div>
  );
}

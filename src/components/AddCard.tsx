import { useState } from 'react';
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
          minHeight: 'var(--row-avatar, 44px)',
          color: isHovered
            ? 'var(--accent-raw, var(--accent))'
            : 'var(--muted-raw, var(--muted-foreground))',
          fontSize: 13,
          fontWeight: 500,
          transition: 'border-color 150ms, background 150ms, color 150ms',
        }}
      >
        <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
          +
        </span>
        <span>Add Mule</span>
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
        transition: 'border-color 150ms, background 150ms',
        minHeight: ROSTER_CARD_MIN_HEIGHT,
        aspectRatio: ROSTER_CARD_ASPECT,
      }}
    >
      <div style={{ display: 'grid', placeItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: isHovered ? 'var(--accent-soft)' : 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'grid',
            placeItems: 'center',
            color: isHovered
              ? 'var(--accent-raw, var(--accent))'
              : 'var(--muted-raw, var(--muted-foreground))',
            fontSize: 24,
            lineHeight: 1,
            transition: 'background 150ms, color 150ms',
          }}
        >
          +
        </div>
        <span
          style={{
            color: 'var(--muted-raw, var(--muted-foreground))',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Add Mule
        </span>
      </div>
    </div>
  );
}

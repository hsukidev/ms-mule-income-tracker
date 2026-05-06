import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { AddCard } from '../AddCard';

describe('AddCard', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-display');
  });

  it('renders with "Add Mule" text', () => {
    render(<AddCard onClick={vi.fn()} />);
    expect(screen.getByText('Add Mule')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<AddCard onClick={onClick} />);
    fireEvent.click(screen.getByText('Add Mule'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  describe('display-aware', () => {
    it('renders the card-shaped tile when display = cards', () => {
      const { container } = render(<AddCard onClick={vi.fn()} />, { defaultDisplay: 'cards' });
      const tile = container.querySelector('[data-add-card]') as HTMLElement;
      expect(tile).toBeTruthy();
      expect(tile.style.aspectRatio.replace(/\s+/g, '')).toBe('3/4');
    });

    it('renders a row-shaped affordance (no aspect-ratio, full-width) when display = list', () => {
      const { container } = render(<AddCard onClick={vi.fn()} />, { defaultDisplay: 'list' });
      const row = container.querySelector('[data-add-row]') as HTMLElement;
      expect(row).toBeTruthy();
      // Row variant must NOT carry the 3/4 card aspect ratio.
      expect(row.style.aspectRatio).toBe('');
      // Row variant should report the same Add-mule accessible name.
      expect(row.getAttribute('aria-label')).toBe('Add mule');
    });

    it('row variant fires onClick', () => {
      const onClick = vi.fn();
      render(<AddCard onClick={onClick} />, { defaultDisplay: 'list' });
      fireEvent.click(screen.getByLabelText('Add mule'));
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});

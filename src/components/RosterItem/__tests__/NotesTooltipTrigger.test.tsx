import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import { NotesTooltipTrigger } from '../NotesTooltipTrigger';

describe('NotesTooltipTrigger', () => {
  const ICON_NAME = /show character notes/i;

  it('renders nothing when notes is empty', () => {
    const { container } = render(<NotesTooltipTrigger notes="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when notes is whitespace-only', () => {
    const { container } = render(<NotesTooltipTrigger notes={'   \n\t '} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a button with the expected aria-label when notes are non-empty', () => {
    render(<NotesTooltipTrigger notes="main mule" />);
    const button = screen.getByRole('button', { name: ICON_NAME });
    expect(button).toBeTruthy();
    expect(button.tagName).toBe('BUTTON');
  });

  it('shows the trimmed notes content in the tooltip when focused', async () => {
    render(<NotesTooltipTrigger notes="  owes 8 legion levels  " />);
    fireEvent.focus(screen.getByRole('button', { name: ICON_NAME }));
    expect(await screen.findByText('owes 8 legion levels')).toBeTruthy();
  });

  it('renders a small icon (size-3.5) by default', () => {
    render(<NotesTooltipTrigger notes="note" />);
    const button = screen.getByRole('button', { name: ICON_NAME });
    const icon = button.querySelector('svg');
    expect(icon?.getAttribute('class')).toContain('size-3.5');
  });

  it('renders a medium icon (size-4) when iconSize="md"', () => {
    render(<NotesTooltipTrigger notes="note" iconSize="md" />);
    const button = screen.getByRole('button', { name: ICON_NAME });
    const icon = button.querySelector('svg');
    expect(icon?.getAttribute('class')).toContain('size-4');
  });

  it('does not bubble click events to ancestors', () => {
    let bubbled = false;
    render(
      <div onClick={() => (bubbled = true)}>
        <NotesTooltipTrigger notes="note" />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: ICON_NAME }));
    expect(bubbled).toBe(false);
  });
});

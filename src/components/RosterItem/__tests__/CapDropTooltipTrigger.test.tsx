import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import { CapDropTooltipTrigger } from '../CapDropTooltipTrigger';
import { bosses } from '../../../data/bosses';
import type { SlateKey } from '../../../data/muleBossSlate';

const LUCID = bosses.find((b) => b.family === 'lucid')!.id;
const HILLA = bosses.find((b) => b.family === 'hilla')!.id;
const HARD_LUCID = `${LUCID}:hard:weekly`;
const NORMAL_HILLA = `${HILLA}:normal:daily`;

describe('CapDropTooltipTrigger', () => {
  const ICON_NAME = /show bosses dropped to cap/i;

  it('renders nothing when droppedKeys is empty', () => {
    const { container } = render(<CapDropTooltipTrigger droppedKeys={new Map()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a button with the expected aria-label when droppedKeys has entries', () => {
    render(<CapDropTooltipTrigger droppedKeys={new Map([[HARD_LUCID, 1]])} />);
    const button = screen.getByRole('button', { name: ICON_NAME });
    expect(button).toBeTruthy();
    expect(button.tagName).toBe('BUTTON');
  });

  it('shows weekly-line content in the tooltip when focused', async () => {
    render(<CapDropTooltipTrigger droppedKeys={new Map([[HARD_LUCID, 1]])} />);
    fireEvent.focus(screen.getByRole('button', { name: ICON_NAME }));
    expect(await screen.findByText('Hard Lucid dropped')).toBeTruthy();
  });

  it('shows daily-line content with count + "daily" suffix in the tooltip', async () => {
    render(<CapDropTooltipTrigger droppedKeys={new Map([[NORMAL_HILLA, 3]])} />);
    fireEvent.focus(screen.getByRole('button', { name: ICON_NAME }));
    expect(await screen.findByText('3× daily Normal Hilla dropped')).toBeTruthy();
  });

  it('stacks tooltip lines vertically in Boss Matrix display order', async () => {
    const droppedKeys = new Map<SlateKey, number>([
      [NORMAL_HILLA, 2],
      [HARD_LUCID, 1],
    ]);
    render(<CapDropTooltipTrigger droppedKeys={droppedKeys} />);
    fireEvent.focus(screen.getByRole('button', { name: ICON_NAME }));
    const lucid = await screen.findByText('Hard Lucid dropped');
    const hilla = await screen.findByText('2× daily Normal Hilla dropped');
    const tooltipBody = lucid.parentElement!;
    expect(tooltipBody).toBe(hilla.parentElement);
    const order = Array.from(tooltipBody.children);
    expect(order.indexOf(lucid)).toBeLessThan(order.indexOf(hilla));
  });

  it('does not bubble click events to ancestors', () => {
    let bubbled = false;
    render(
      <div onClick={() => (bubbled = true)}>
        <CapDropTooltipTrigger droppedKeys={new Map([[HARD_LUCID, 1]])} />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: ICON_NAME }));
    expect(bubbled).toBe(false);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../dropdown-menu';

function renderMenu(onSelectFirst: () => void = vi.fn()) {
  return render(
    <DropdownMenu>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onSelectFirst}>First</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Second</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe('DropdownMenu primitive (smoke)', () => {
  it('renders the trigger and keeps the menu unmounted while closed', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeTruthy();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens via trigger click and announces role="menu" with menuitem children', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeTruthy();
    });
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe('First');
    expect(items[1].textContent).toBe('Second');
  });

  it('closes on Escape', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeTruthy();
    });
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
      code: 'Escape',
    });
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  it('closes on outside click', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeTruthy();
    });
    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../dialog';

function renderDialog() {
  return render(
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>The title</DialogTitle>
          <DialogDescription>The description</DialogDescription>
        </DialogHeader>
        <p>Body content</p>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  );
}

describe('Dialog primitive (smoke)', () => {
  it('renders the trigger and keeps content unmounted while closed', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Open dialog' })).toBeTruthy();
    expect(screen.queryByText('The title')).toBeNull();
  });

  it('opens via trigger click and renders title, description, body', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    await waitFor(() => {
      expect(screen.getByText('The title')).toBeTruthy();
    });
    expect(screen.getByText('The description')).toBeTruthy();
    expect(screen.getByText('Body content')).toBeTruthy();
  });

  it('closes when Escape is pressed', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    await waitFor(() => {
      expect(screen.getByText('The title')).toBeTruthy();
    });
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
      code: 'Escape',
    });
    await waitFor(() => {
      expect(screen.queryByText('The title')).toBeNull();
    });
  });

  it('overlay backdrop carries the same classes as the Sheet overlay', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    await waitFor(() => {
      expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeTruthy();
    });
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
    expect(overlay.className).toContain('bg-black/10');
    expect(overlay.className).toContain('supports-backdrop-filter:backdrop-blur-xs');
  });
});

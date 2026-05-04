import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';

import { DataManagementDialog } from '../DataManagementDialog';

describe('DataManagementDialog (chooser screen)', () => {
  it('does not render when closed', () => {
    render(<DataManagementDialog open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText('Data Management')).toBeNull();
  });

  it('renders the chooser title and both option rows when open', async () => {
    render(<DataManagementDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Data Management')).toBeTruthy();
    });
    expect(screen.getByText('Export Data')).toBeTruthy();
    expect(screen.getByText('Generate user data transfer code')).toBeTruthy();
    expect(screen.getByText('Import Data')).toBeTruthy();
    expect(screen.getByText('Paste user data transfer code')).toBeTruthy();
  });

  it('clicking Export advances internal state (chooser content goes away)', async () => {
    render(<DataManagementDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Export Data/ }));
    await waitFor(() => {
      expect(screen.queryByText('Generate user data transfer code')).toBeNull();
    });
  });

  it('clicking Import advances internal state (chooser content goes away)', async () => {
    render(<DataManagementDialog open={true} onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Import Data')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Import Data/ }));
    await waitFor(() => {
      expect(screen.queryByText('Paste user data transfer code')).toBeNull();
    });
  });

  it('Escape closes the dialog (calls onOpenChange with false)', async () => {
    const onOpenChange = vi.fn();
    render(<DataManagementDialog open={true} onOpenChange={onOpenChange} />);
    await waitFor(() => {
      expect(screen.getByText('Data Management')).toBeTruthy();
    });
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
      code: 'Escape',
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

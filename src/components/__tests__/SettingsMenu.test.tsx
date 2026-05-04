import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';

import { SettingsMenu } from '../SettingsMenu';

describe('SettingsMenu', () => {
  it('renders a gear button labelled "Settings"', () => {
    render(<SettingsMenu />);
    expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
  });

  it('keeps the menu unmounted while closed', () => {
    render(<SettingsMenu />);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens a role="menu" with a single "Data Management" item on click', async () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeTruthy();
    });
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Data Management');
  });

  it('activating "Data Management" opens the dialog with chooser screen', async () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: /Data Management/ }));
    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeTruthy();
    });
    expect(screen.getByText('Import Data')).toBeTruthy();
  });
});

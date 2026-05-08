import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';

import { Popover } from '@/components/ui/popover';
import { UserPresetPopover } from '../UserPresetPopover';
import type { UserPreset } from '../../data/userPresets';

function preset(id: string, name: string, slateKeys: readonly string[] = ['k1']): UserPreset {
  return { id, name, slateKeys };
}

interface RenderOpts {
  userPresets?: readonly UserPreset[];
  slateKeys?: readonly string[];
  matchedUserPreset?: UserPreset | null;
  onApply?: (presetId: string) => void;
  onSave?: (name: string, slateKeys: readonly string[]) => void;
  onDelete?: (presetId: string) => void;
}

function renderOpenPopover(opts: RenderOpts = {}) {
  const onApply = opts.onApply ?? vi.fn<(presetId: string) => void>();
  const onSave = opts.onSave ?? vi.fn<(name: string, slateKeys: readonly string[]) => void>();
  const onDelete = opts.onDelete ?? vi.fn<(presetId: string) => void>();
  render(
    <Popover open>
      <UserPresetPopover
        userPresets={opts.userPresets ?? []}
        slateKeys={opts.slateKeys ?? []}
        matchedUserPreset={opts.matchedUserPreset ?? null}
        onApply={onApply}
        onSave={onSave}
        onDelete={onDelete}
      />
    </Popover>,
  );
  return { onApply, onSave, onDelete };
}

describe('UserPresetPopover', () => {
  describe('empty states', () => {
    it('renders "No presets saved yet" + sub-line when library empty and slate empty', () => {
      renderOpenPopover({ userPresets: [], slateKeys: [] });
      expect(screen.getByText(/no presets saved yet/i)).toBeTruthy();
      expect(screen.getByText(/select bosses to save preset/i)).toBeTruthy();
    });

    it('renders only "No presets saved yet" when library empty but slate non-empty', () => {
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'] });
      expect(screen.getByText(/no presets saved yet/i)).toBeTruthy();
      expect(screen.queryByText(/select bosses to save preset/i)).toBeNull();
    });

    it('renders "No presets match `q`" when search yields no rows', () => {
      renderOpenPopover({
        userPresets: [preset('p1', 'CRA Mule'), preset('p2', 'CTENE Mule')],
        slateKeys: ['k1'],
      });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'lomien' } });
      expect(screen.getByText(/no presets match `lomien`/i)).toBeTruthy();
    });
  });

  describe('list rendering', () => {
    it('renders a row for each User Preset by name', () => {
      renderOpenPopover({
        userPresets: [preset('p1', 'Alpha'), preset('p2', 'Beta'), preset('p3', 'Gamma')],
        slateKeys: ['k1'],
      });
      expect(screen.getByRole('button', { name: 'Alpha' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Beta' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Gamma' })).toBeTruthy();
    });

    it('filters rows by case-insensitive substring on name', () => {
      renderOpenPopover({
        userPresets: [preset('p1', 'CRA Mule'), preset('p2', 'CTENE Mule')],
        slateKeys: ['k1'],
      });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'cra' } });
      expect(screen.getByRole('button', { name: 'CRA Mule' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'CTENE Mule' })).toBeNull();
    });

    it('marks the matched preset row with aria-current="true"', () => {
      const matched = preset('p1', 'CRA Mule');
      renderOpenPopover({
        userPresets: [matched, preset('p2', 'Other')],
        slateKeys: ['k1'],
        matchedUserPreset: matched,
      });
      const row = screen.getByRole('button', { name: 'CRA Mule' });
      expect(row.getAttribute('aria-current')).toBe('true');
      expect(screen.getByRole('button', { name: 'Other' }).getAttribute('aria-current')).toBeNull();
    });
  });

  describe('apply', () => {
    it('clicking a preset row calls onApply with the preset id', () => {
      const onApply = vi.fn();
      renderOpenPopover({
        userPresets: [preset('p1', 'Mine')],
        slateKeys: ['k1'],
        onApply,
      });
      fireEvent.click(screen.getByRole('button', { name: 'Mine' }));
      expect(onApply).toHaveBeenCalledWith('p1');
    });
  });

  describe('save (footer button)', () => {
    it('the footer button is hidden when slate is empty', () => {
      renderOpenPopover({ userPresets: [], slateKeys: [] });
      expect(screen.queryByRole('button', { name: /save current as preset/i })).toBeNull();
    });

    it('the footer button is rendered (disabled) when slate non-empty but name is empty', () => {
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'] });
      const btn = screen.getByRole('button', {
        name: /save current as preset/i,
      }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('the footer button enables when slate non-empty and name typed', () => {
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'] });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'My Preset' } });
      const btn = screen.getByRole('button', {
        name: /save current as preset/i,
      }) as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it('the footer button is disabled when a saved preset already matches', () => {
      const matched = preset('p1', 'Mine', ['k1']);
      renderOpenPopover({
        userPresets: [matched],
        slateKeys: ['k1'],
        matchedUserPreset: matched,
      });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'Other Name' } });
      const btn = screen.getByRole('button', {
        name: /save current as preset/i,
      }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('clicking save with a typed name calls onSave with trimmed name + slateKeys', () => {
      const onSave = vi.fn();
      renderOpenPopover({ userPresets: [], slateKeys: ['k1', 'k2'], onSave });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: '  My Preset  ' } });
      const btn = screen.getByRole('button', { name: /save current as preset/i });
      fireEvent.click(btn);
      expect(onSave).toHaveBeenCalledWith('My Preset', ['k1', 'k2']);
    });

    it('input maxLength caps at 40', () => {
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'] });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      expect(search.maxLength).toBe(40);
    });
  });

  describe('delete', () => {
    it('clicking the delete affordance on a row calls onDelete with the preset id', () => {
      const onDelete = vi.fn();
      renderOpenPopover({
        userPresets: [preset('p1', 'Mine')],
        slateKeys: ['k1'],
        onDelete,
      });
      fireEvent.click(screen.getByRole('button', { name: /delete mine/i }));
      expect(onDelete).toHaveBeenCalledWith('p1');
    });
  });
});

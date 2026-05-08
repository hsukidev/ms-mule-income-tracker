import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';

import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { UserPresetPopover } from '../UserPresetPopover';
import type { UserPreset } from '../../data/userPresets';

function preset(id: string, name: string, slateKeys: readonly string[] = ['k1']): UserPreset {
  return { id, name, slateKeys, partySizes: {} };
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

// Controlled-Popover host so Escape-to-close can be observed.
function ControlledHost(opts: RenderOpts = {}) {
  const [open, setOpen] = useState(true);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button">Trigger</button>} />
      <UserPresetPopover
        userPresets={opts.userPresets ?? []}
        slateKeys={opts.slateKeys ?? []}
        matchedUserPreset={opts.matchedUserPreset ?? null}
        onApply={opts.onApply ?? vi.fn()}
        onSave={opts.onSave ?? vi.fn()}
        onDelete={opts.onDelete ?? vi.fn()}
      />
    </Popover>
  );
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

    it('the footer button is rendered enabled when slate non-empty but name is empty (Slice 3 — click triggers empty-name flow, not a no-op disable)', () => {
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'] });
      const btn = screen.getByRole('button', {
        name: /save current as preset/i,
      }) as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
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

  describe('delete (Slice 4)', () => {
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

    it('every row exposes a delete affordance (one × per row, queryable by aria-label)', () => {
      renderOpenPopover({
        userPresets: [preset('p1', 'Alpha'), preset('p2', 'Beta'), preset('p3', 'Gamma')],
        slateKeys: ['k1'],
      });
      expect(screen.getByRole('button', { name: /delete alpha/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /delete beta/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /delete gamma/i })).toBeTruthy();
    });

    it('the delete affordance is reveal-on-hover styled (invisible by default, group-hover:visible)', () => {
      // Hover state cannot be simulated in jsdom, so assert the CSS contract
      // directly: the row carries `group`, the × button is `invisible` and
      // becomes visible via `group-hover:visible` (and `focus-visible:visible`
      // for keyboard tab order).
      renderOpenPopover({
        userPresets: [preset('p1', 'Mine')],
        slateKeys: ['k1'],
      });
      const deleteBtn = screen.getByRole('button', { name: /delete mine/i });
      const row = deleteBtn.closest('li');
      expect(row?.className).toContain('group');
      expect(deleteBtn.className).toContain('invisible');
      expect(deleteBtn.className).toContain('group-hover:visible');
      expect(deleteBtn.className).toContain('focus-visible:visible');
    });

    it('the delete affordance is reachable via keyboard focus', () => {
      renderOpenPopover({
        userPresets: [preset('p1', 'Mine')],
        slateKeys: ['k1'],
      });
      const deleteBtn = screen.getByRole('button', { name: /delete mine/i }) as HTMLButtonElement;
      deleteBtn.focus();
      expect(document.activeElement).toBe(deleteBtn);
    });

    it('clicking delete removes the row from the list (state-driven host)', () => {
      function Host() {
        const [presets, setPresets] = useState<readonly UserPreset[]>([
          preset('p1', 'Mine'),
          preset('p2', 'Other'),
        ]);
        return (
          <Popover open>
            <UserPresetPopover
              userPresets={presets}
              slateKeys={['k1']}
              matchedUserPreset={null}
              onApply={vi.fn()}
              onSave={vi.fn()}
              onDelete={(id) => setPresets((prev) => prev.filter((p) => p.id !== id))}
            />
          </Popover>
        );
      }
      render(<Host />);
      expect(screen.getByRole('button', { name: 'Mine' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Other' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /delete mine/i }));
      expect(screen.queryByRole('button', { name: 'Mine' })).toBeNull();
      expect(screen.queryByRole('button', { name: /delete mine/i })).toBeNull();
      // Sibling row stays put.
      expect(screen.getByRole('button', { name: 'Other' })).toBeTruthy();
    });

    it('hovering a non-matched row does not disturb the matched-row highlight', () => {
      const matched = preset('p1', 'Matched', ['k1']);
      const other = preset('p2', 'Other', ['k2']);
      renderOpenPopover({
        userPresets: [matched, other],
        slateKeys: ['k1'],
        matchedUserPreset: matched,
      });
      const matchedRow = screen.getByRole('button', { name: 'Matched' });
      const otherRow = screen.getByRole('button', { name: 'Other' });
      expect(matchedRow.getAttribute('aria-current')).toBe('true');
      expect(otherRow.getAttribute('aria-current')).toBeNull();
      // Mouse over the non-matched row — the highlight must remain anchored
      // on the matched row (aria-current is derived from props, not hover).
      fireEvent.mouseEnter(otherRow);
      fireEvent.mouseOver(otherRow);
      expect(matchedRow.getAttribute('aria-current')).toBe('true');
      expect(otherRow.getAttribute('aria-current')).toBeNull();
    });

    it('clicking the × on the matched row hands off the deletion (parent then re-derives the pill)', () => {
      // The popover is a leaf: it does not own the pill state. The match
      // demotion is the parent's job (usePresetPill re-runs when the
      // userPresets array shrinks). We only have to confirm the click
      // reaches `onDelete` with the matched preset's id.
      const matched = preset('p1', 'Matched', ['k1']);
      const onDelete = vi.fn();
      renderOpenPopover({
        userPresets: [matched],
        slateKeys: ['k1'],
        matchedUserPreset: matched,
        onDelete,
      });
      fireEvent.click(screen.getByRole('button', { name: /delete matched/i }));
      expect(onDelete).toHaveBeenCalledWith('p1');
    });
  });

  describe('empty-name save flow (Slice 3)', () => {
    it('clicking save with the input empty focuses the input', () => {
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'] });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      const btn = screen.getByRole('button', { name: /save current as preset/i });
      fireEvent.click(btn);
      expect(document.activeElement).toBe(search);
    });

    it('clicking save with the input empty marks the input aria-invalid (red border)', () => {
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'] });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      const btn = screen.getByRole('button', { name: /save current as preset/i });
      fireEvent.click(btn);
      expect(search.getAttribute('aria-invalid')).toBe('true');
    });

    it('clicking save with the input empty surfaces the "Enter a name for this preset" tooltip', async () => {
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'] });
      const btn = screen.getByRole('button', { name: /save current as preset/i });
      fireEvent.click(btn);
      await waitFor(() => {
        expect(screen.getByText(/enter a name for this preset/i)).toBeTruthy();
      });
    });

    it('clicking save with the input empty does NOT call onSave', () => {
      const onSave = vi.fn();
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'], onSave });
      const btn = screen.getByRole('button', { name: /save current as preset/i });
      fireEvent.click(btn);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('first keystroke after empty-submit clears aria-invalid and the tooltip', async () => {
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'] });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      const btn = screen.getByRole('button', { name: /save current as preset/i });
      fireEvent.click(btn);
      expect(search.getAttribute('aria-invalid')).toBe('true');
      fireEvent.change(search, { target: { value: 'a' } });
      expect(search.getAttribute('aria-invalid')).not.toBe('true');
      await waitFor(() => {
        expect(screen.queryByText(/enter a name for this preset/i)).toBeNull();
      });
    });
  });

  describe('collision flow (Slice 3)', () => {
    it('typing a name that case-insensitive-equals an existing preset disables the save button', () => {
      renderOpenPopover({
        userPresets: [preset('p1', 'CRA Mule')],
        slateKeys: ['k2'],
      });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'cra mule' } });
      const btn = screen.getByRole('button', {
        name: /save current as preset/i,
      }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('typing a colliding name surfaces the "Name already in use" tooltip', async () => {
      renderOpenPopover({
        userPresets: [preset('p1', 'CRA Mule')],
        slateKeys: ['k2'],
      });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'CRA MULE' } });
      await waitFor(() => {
        expect(screen.getByText(/name already in use/i)).toBeTruthy();
      });
    });

    it('typing a colliding name highlights the colliding row (aria-current="true")', () => {
      renderOpenPopover({
        userPresets: [preset('p1', 'CRA Mule'), preset('p2', 'Other CRA Mule')],
        slateKeys: ['k2'],
      });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      // The substring filter still includes "Other CRA Mule" so we can
      // assert the non-collider stays unhighlighted in the same render.
      fireEvent.change(search, { target: { value: 'cra mule' } });
      const colliding = screen.getByRole('button', { name: 'CRA Mule' });
      expect(colliding.getAttribute('aria-current')).toBe('true');
      const other = screen.getByRole('button', { name: 'Other CRA Mule' });
      expect(other.getAttribute('aria-current')).toBeNull();
    });

    it('clicking the colliding row applies that preset (escape hatch)', () => {
      const onApply = vi.fn();
      renderOpenPopover({
        userPresets: [preset('p1', 'CRA Mule')],
        slateKeys: ['k2'],
        onApply,
      });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'cra mule' } });
      fireEvent.click(screen.getByRole('button', { name: 'CRA Mule' }));
      expect(onApply).toHaveBeenCalledWith('p1');
    });
  });

  describe('keyboard (Slice 3)', () => {
    it('pressing Enter in the input saves when the name is valid', () => {
      const onSave = vi.fn();
      renderOpenPopover({ userPresets: [], slateKeys: ['k1', 'k2'], onSave });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: '  My Preset  ' } });
      fireEvent.keyDown(search, { key: 'Enter', code: 'Enter' });
      expect(onSave).toHaveBeenCalledWith('My Preset', ['k1', 'k2']);
    });

    it('pressing Enter with the input empty triggers the empty-name flow (no save)', async () => {
      const onSave = vi.fn();
      renderOpenPopover({ userPresets: [], slateKeys: ['k1'], onSave });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.keyDown(search, { key: 'Enter', code: 'Enter' });
      expect(onSave).not.toHaveBeenCalled();
      expect(search.getAttribute('aria-invalid')).toBe('true');
      await waitFor(() => {
        expect(screen.getByText(/enter a name for this preset/i)).toBeTruthy();
      });
    });

    it('pressing Enter with a colliding name does nothing', () => {
      const onSave = vi.fn();
      renderOpenPopover({
        userPresets: [preset('p1', 'CRA Mule')],
        slateKeys: ['k2'],
        onSave,
      });
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'CRA Mule' } });
      fireEvent.keyDown(search, { key: 'Enter', code: 'Enter' });
      expect(onSave).not.toHaveBeenCalled();
    });

    it('pressing Escape inside the popover closes it', async () => {
      render(<ControlledHost userPresets={[preset('p1', 'Mine')]} slateKeys={['k1']} />);
      const search = screen.getByLabelText(/search or name/i) as HTMLInputElement;
      expect(search).toBeTruthy();
      fireEvent.keyDown(search, { key: 'Escape', code: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByLabelText(/search or name/i)).toBeNull();
      });
    });
  });
});

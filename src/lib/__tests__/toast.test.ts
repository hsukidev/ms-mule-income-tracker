import { describe, expect, it, vi, beforeEach } from 'vitest';

const sonnerMock = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('sonner', () => sonnerMock);

import { toast } from '../toast';

beforeEach(() => {
  sonnerMock.toast.mockClear();
  sonnerMock.toast.success.mockClear();
  sonnerMock.toast.error.mockClear();
  sonnerMock.toast.info.mockClear();
});

describe('toast helper', () => {
  it('success() forwards the message to sonner.toast.success', () => {
    toast.success('hello');
    expect(sonnerMock.toast.success).toHaveBeenCalledTimes(1);
    expect(sonnerMock.toast.success).toHaveBeenCalledWith('hello', undefined);
  });

  it('success() forwards description and action options through to sonner.toast.success', () => {
    const onClick = vi.fn();
    toast.success('Successfully deleted', {
      description: 'Alice removed from roster',
      action: { label: 'Undo', onClick },
    });
    expect(sonnerMock.toast.success).toHaveBeenCalledWith('Successfully deleted', {
      description: 'Alice removed from roster',
      action: { label: 'Undo', onClick },
    });
  });
});

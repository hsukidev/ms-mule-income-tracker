import { describe, expect, it } from 'vitest';
import { render } from '@/test/test-utils';
import { ResetCountdown } from '../ResetCountdown';

describe('ResetCountdown', () => {
  it('renders left-aligned by default (no text-align: right on container)', () => {
    const { container } = render(<ResetCountdown />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.textAlign).not.toBe('right');
  });

  it('right-aligns its content when align="right"', () => {
    const { container } = render(<ResetCountdown align="right" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.textAlign).toBe('right');
  });
});

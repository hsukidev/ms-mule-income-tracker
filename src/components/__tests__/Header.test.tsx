import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { Header } from '../Header';

// `<Header />` is mounted in isolation here, so the TanStack Router
// `<Link>` it wraps the logo with has no router context. Stub `Link` to a
// plain anchor and `useMatchRoute` to a no-match function — full routing
// is exercised in the app-level smoke tests.
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      to,
      children,
      ...rest
    }: {
      to: string;
      children: React.ReactNode;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
    useMatchRoute: () => () => false,
  };
});

describe('Header (shadcn/ThemeProvider)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('light');
  });

  it('renders theme toggle button', () => {
    render(<Header />, { defaultTheme: 'dark' });
    const toggleBtn = screen.getByLabelText('Switch to light mode');
    expect(toggleBtn).toBeTruthy();
  });

  it('theme toggle button has pointer cursor on hover', () => {
    render(<Header />, { defaultTheme: 'dark' });
    const toggleBtn = screen.getByLabelText('Switch to light mode');
    expect(toggleBtn.className).toContain('cursor-pointer');
  });

  it('shows correct aria-label for dark mode (Switch to light mode)', () => {
    render(<Header />, { defaultTheme: 'dark' });
    expect(screen.getByLabelText('Switch to light mode')).toBeTruthy();
  });

  it('shows correct aria-label for light mode (Switch to dark mode)', () => {
    render(<Header />, { defaultTheme: 'light' });
    expect(screen.getByLabelText('Switch to dark mode')).toBeTruthy();
  });

  it('toggles theme on button click', () => {
    render(<Header />, { defaultTheme: 'dark' });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    fireEvent.click(screen.getByLabelText('Switch to light mode'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('does not render the WorldSelect', () => {
    render(<Header />, { defaultWorld: null });
    expect(screen.queryByLabelText('Select world')).toBeNull();
  });

  it('does not render the Reset Countdown in the header (it lives on the KpiCard)', () => {
    const { container } = render(<Header />, { defaultWorld: null });
    expect(container.textContent ?? '').not.toMatch(/RESET IN/i);
  });
});

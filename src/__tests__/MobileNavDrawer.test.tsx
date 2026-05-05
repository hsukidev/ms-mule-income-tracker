import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { MobileNavDrawer } from '../components/MobileNavDrawer';
import { drawerNavItems } from '../constants/navItems';

// `<MobileNavDrawer />` is mounted in isolation, so the TanStack Router
// `<Link>` it renders inside the drawer has no router context. Stub `Link`
// to a plain anchor — full link routing is exercised in the app-level
// smoke tests.
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      to,
      children,
      onClick,
      className,
      style,
    }: {
      to: string;
      children: React.ReactNode;
      onClick?: React.MouseEventHandler<HTMLAnchorElement>;
      className?: string;
      style?: React.CSSProperties;
    }) => (
      <a
        href={to}
        onClick={(e) => {
          e.preventDefault();
          onClick?.(e);
        }}
        className={className}
        style={style}
      >
        {children}
      </a>
    ),
  };
});

function queryDrawer() {
  return document.querySelector('[data-mobile-nav-drawer]');
}

function openDrawer() {
  fireEvent.click(screen.getByLabelText(/open navigation menu/i));
}

async function waitForOpenDrawer() {
  return await waitFor(() => {
    const el = queryDrawer();
    if (!el) throw new Error('drawer not open yet');
    return el;
  });
}

describe('MobileNavDrawer', () => {
  it('does not render drawer content initially', () => {
    render(<MobileNavDrawer />);
    expect(queryDrawer()).toBeNull();
  });

  it('opens the drawer when the hamburger button is clicked', async () => {
    render(<MobileNavDrawer />);
    openDrawer();
    await waitForOpenDrawer();
  });

  it('renders a Home link pointing to "/"', async () => {
    render(<MobileNavDrawer />);
    openDrawer();
    const drawer = await waitForOpenDrawer();

    const homeLink = drawer.querySelector('a[href="/"]');
    expect(homeLink).toBeTruthy();
    expect(homeLink!.textContent).toContain('Home');
  });

  it('closes when the Home link is clicked', async () => {
    render(<MobileNavDrawer />);
    openDrawer();
    const drawer = await waitForOpenDrawer();

    const homeLink = drawer.querySelector('a[href="/"]') as HTMLAnchorElement;
    fireEvent.click(homeLink);

    await waitFor(() => {
      expect(queryDrawer()).toBeNull();
    });
  });

  it("drawer's nav items match the drawerNavItems constant", async () => {
    render(<MobileNavDrawer />);
    openDrawer();
    const drawer = await waitForOpenDrawer();

    expect(drawerNavItems.length).toBeGreaterThan(0);
    const renderedLinks = Array.from(drawer.querySelectorAll('a'));
    expect(renderedLinks).toHaveLength(drawerNavItems.length);

    for (const item of drawerNavItems) {
      const link = drawer.querySelector(`a[href="${item.to}"]`);
      expect(link).toBeTruthy();
      expect(link!.textContent).toContain(item.label);
    }
  });

  it('closes when an internal link is clicked', async () => {
    render(<MobileNavDrawer />);
    openDrawer();
    const drawer = await waitForOpenDrawer();

    const link = drawer.querySelector(`a[href="${drawerNavItems[0].to}"]`) as HTMLAnchorElement;
    fireEvent.click(link);

    await waitFor(() => {
      expect(queryDrawer()).toBeNull();
    });
  });

  it('closes when the overlay is clicked', async () => {
    render(<MobileNavDrawer />);
    openDrawer();
    await waitForOpenDrawer();

    const overlay = document.querySelector('[data-slot="sheet-overlay"]') as HTMLElement;
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(queryDrawer()).toBeNull();
    });
  });

  it('closes when Escape is pressed', async () => {
    render(<MobileNavDrawer />);
    openDrawer();
    const drawer = await waitForOpenDrawer();

    fireEvent.keyDown(drawer, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(queryDrawer()).toBeNull();
    });
  });
});

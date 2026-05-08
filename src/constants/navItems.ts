import type { LinkProps } from '@tanstack/react-router';

export type NavItem = {
  label: string;
  to: NonNullable<LinkProps['to']>;
};

export const navItems: readonly NavItem[] = [
  { label: 'About', to: '/about' },
  { label: 'Changelog', to: '/changelog' },
];

export const drawerNavItems: readonly NavItem[] = [{ label: 'Home', to: '/' }, ...navItems];

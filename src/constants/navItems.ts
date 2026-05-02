import type { LinkProps } from '@tanstack/react-router';

export type NavItem = {
  label: string;
  to: NonNullable<LinkProps['to']>;
};

export const navItems: readonly NavItem[] = [{ label: 'Changelog', to: '/changelog' }];

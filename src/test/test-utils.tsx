import { type ReactElement } from 'react';
import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/context/ThemeProvider';
import { DensityProvider } from '@/context/DensityProvider';
import { WorldProvider } from '@/context/WorldProvider';
import { IncomeProvider } from '@/modules/income';
import type { WorldId } from '@/data/worlds';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  defaultTheme?: 'dark' | 'light';
  defaultAbbreviated?: boolean;
  defaultWorld?: WorldId | null;
}

export function render(
  ui: ReactElement,
  {
    defaultTheme = 'dark',
    defaultAbbreviated = true,
    defaultWorld,
    ...options
  }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider defaultTheme={defaultTheme}>
        <DensityProvider>
          <WorldProvider defaultWorld={defaultWorld}>
            <IncomeProvider defaultAbbreviated={defaultAbbreviated}>{children}</IncomeProvider>
          </WorldProvider>
        </DensityProvider>
      </ThemeProvider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export { screen, fireEvent, waitFor, within, act } from '@testing-library/react';

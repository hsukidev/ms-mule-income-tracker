import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from '../context/ThemeProvider';
import { DensityProvider } from '../context/DensityProvider';
import { DisplayProvider } from '../context/DisplayProvider';
import { WorldProvider } from '../context/WorldProvider';
import { IncomeProvider } from '../modules/income';
import { Header } from '../components/Header';
import { Toaster } from '../components/ui/sonner';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <ThemeProvider defaultTheme="dark">
      <DensityProvider>
        <DisplayProvider>
          <WorldProvider>
            <IncomeProvider>
              <div className="min-h-screen bg-background text-foreground">
                <Header />
                <Outlet />
              </div>
            </IncomeProvider>
          </WorldProvider>
        </DisplayProvider>
      </DensityProvider>
      <Toaster />
    </ThemeProvider>
  );
}

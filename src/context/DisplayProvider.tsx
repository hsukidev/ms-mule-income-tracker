import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Display = 'cards' | 'list';

interface DisplayContextValue {
  display: Display;
  setDisplay: (display: Display) => void;
  toggleDisplay: () => void;
}

const DisplayContext = createContext<DisplayContextValue | undefined>(undefined);

function getInitialDisplay(): Display {
  try {
    const stored = localStorage.getItem('display');
    if (stored === 'cards' || stored === 'list') return stored;
  } catch {
    // localStorage can throw in private-mode / sandboxed iframes — fall through.
  }
  return 'cards';
}

function applyDisplay(display: Display) {
  document.documentElement.setAttribute('data-display', display);
}

interface DisplayProviderProps {
  children: ReactNode;
}

export function DisplayProvider({ children }: DisplayProviderProps) {
  const [display, setDisplayState] = useState<Display>(getInitialDisplay);

  useEffect(() => {
    applyDisplay(display);
    localStorage.setItem('display', display);
  }, [display]);

  const setDisplay = setDisplayState;

  const toggleDisplay = () => {
    setDisplayState((prev) => (prev === 'cards' ? 'list' : 'cards'));
  };

  return (
    <DisplayContext.Provider value={{ display, setDisplay, toggleDisplay }}>
      {children}
    </DisplayContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDisplay() {
  const context = useContext(DisplayContext);
  if (!context) {
    throw new Error('useDisplay must be used within a DisplayProvider');
  }
  return context;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface FormatPreferenceContextValue {
  abbreviated: boolean;
  toggle: () => void;
}

// Exported only for the IncomeProvider backward-compat shim, which calls
// `useContext(FormatPreferenceContext)` to detect whether an outer
// FormatPreferenceProvider is already mounted. Consumers should use the
// `useFormatPreference` hook below.
// eslint-disable-next-line react-refresh/only-export-components
export const FormatPreferenceContext = createContext<FormatPreferenceContextValue | undefined>(
  undefined,
);

// localStorage key parallels the other persisted contexts ('theme', 'density',
// 'world', 'display'). Stored as the boolean's string form ('true' | 'false').
const STORAGE_KEY = 'abbreviated';

function getInitialAbbreviated(fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // localStorage can throw in private-mode / sandboxed iframes — fall through.
  }
  return fallback;
}

interface FormatPreferenceProviderProps {
  children: ReactNode;
  defaultAbbreviated?: boolean;
}

export function FormatPreferenceProvider({
  children,
  defaultAbbreviated = true,
}: FormatPreferenceProviderProps) {
  const [abbreviated, setAbbreviated] = useState<boolean>(() =>
    getInitialAbbreviated(defaultAbbreviated),
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(abbreviated));
    } catch {
      // ignore — see getInitialAbbreviated for rationale
    }
  }, [abbreviated]);

  const toggle = useCallback(() => setAbbreviated((a) => !a), []);
  const value = useMemo(() => ({ abbreviated, toggle }), [abbreviated, toggle]);

  return (
    <FormatPreferenceContext.Provider value={value}>{children}</FormatPreferenceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFormatPreference(): FormatPreferenceContextValue {
  const ctx = useContext(FormatPreferenceContext);
  if (!ctx) {
    throw new Error('useFormatPreference must be used within a FormatPreferenceProvider');
  }
  return ctx;
}

/**
 * **Auto-Fullformat-On-Zero Rule** — if `raw === 0` while abbreviated, flip
 * the global **Format Preference** to full once so a dead roster renders as
 * `0` instead of `0B`. No-op otherwise. Idempotent across re-renders of the
 * same zero+abbreviated state; the fired-ref resets when state diverges so a
 * future zero re-fires.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAutoFullFormatOnZero(raw: number): void {
  const { abbreviated, toggle } = useFormatPreference();
  const firedRef = useRef(false);
  useEffect(() => {
    if (raw === 0 && abbreviated) {
      if (!firedRef.current) {
        firedRef.current = true;
        toggle();
      }
    } else {
      firedRef.current = false;
    }
  }, [raw, abbreviated, toggle]);
}

import { useEffect, useState } from 'react';

// Subscribes to a media query. Returns false when matchMedia is unavailable
// (older jsdom in unit tests, SSR), so callers always get the wide layout
// instead of crashing.
export function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    let mql: MediaQueryList;
    try {
      mql = window.matchMedia(query);
    } catch {
      return;
    }
    const update = () => setMatches(mql.matches);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

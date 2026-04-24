import { useEffect, useRef, useState } from 'react';

// Interpolates from the previously-rendered value to `target` over `durationMs`
// using ease-out cubic. Mounts at 0 so callers get a one-time entrance animation
// from 0 → target on first render.
export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    setValue((prev) => {
      fromRef.current = prev;
      return prev;
    });
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setValue(t === 1 ? target : next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

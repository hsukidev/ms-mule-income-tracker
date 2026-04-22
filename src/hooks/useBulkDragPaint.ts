import { useCallback, useEffect, useRef } from 'react';

/**
 * iPhone Photos-style drag-to-select gesture for Bulk Delete Mode.
 *
 * Owns all pointer state as refs so the drag produces zero re-renders from
 * the hook itself. Mouse/pen engage immediately on the first `pointermove`;
 * touch gates behind a 250ms long-press so that short taps open the drawer
 * and vertical swipes scroll the page. On engagement the hook snapshots
 * every Mule's current selection (the Original Snapshot) and fixes the
 * Brush polarity from the inverse of the Start Card's snapshot value. The
 * Paint Range is recomputed on every move as
 * `[min(startIdx, curIdx), max(startIdx, curIdx)]` in Roster order; Mules
 * that leave the range revert to their Original Snapshot, Mules that enter
 * adopt the Brush. Zero-move pointerup falls through to the single-click
 * `toggle` path. `pointercancel` reverts everything. `onClickCapture`
 * swallows the browser's trailing synthetic click after an engaged gesture
 * so the Start Card isn't double-toggled.
 *
 * `pointermove` / `pointerup` / `pointercancel` are attached to `document`
 * while a gesture is active. This mirrors pointer-capture semantics
 * (events keep flowing even if the pointer leaves the boundary) but is
 * portable across JSDOM and real browsers without relying on
 * `setPointerCapture` support.
 */

const TOUCH_LONG_PRESS_MS = 250;
const TOUCH_MOVE_CANCEL_PX = 5;
// Autoscroll tuning for engaged touch paint.
const AUTOSCROLL_ZONE_PX = 100;
const AUTOSCROLL_MAX_PX_PER_FRAME = 14;

type Brush = 'add' | 'remove';

interface Args {
  enabled: boolean;
  orderRef: React.RefObject<string[]>;
  isSelected: (id: string) => boolean;
  setSelected: (id: string, shouldBeSelected: boolean) => void;
}

interface PaintedRange {
  lo: number;
  hi: number;
}

interface Handlers {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onClickCapture: (e: React.MouseEvent<HTMLElement>) => void;
}

function cardIdFromTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const card = target.closest('[data-mule-card]');
  if (!card) return null;
  return card.getAttribute('data-mule-card');
}

function cardIdFromPoint(x: number, y: number): string | null {
  // JSDOM doesn't implement `elementFromPoint` by default — guard so an
  // unrelated bulk-mode test that fires pointer events without mocking it
  // doesn't throw. Real browsers always provide this API.
  if (typeof document.elementFromPoint !== 'function') return null;
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const card = el.closest('[data-mule-card]');
  if (!card) return null;
  return card.getAttribute('data-mule-card');
}

export function useBulkDragPaint({ enabled, orderRef, isSelected, setSelected }: Args): Handlers {
  const startIdRef = useRef<string | null>(null);
  const startIdxRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const brushRef = useRef<Brush | null>(null);
  const originalRef = useRef<Map<string, boolean>>(new Map());
  const paintedRangeRef = useRef<PaintedRange | null>(null);
  const suppressClickRef = useRef(false);
  // Touch long-press bookkeeping: the timer is scheduled on touch pointerdown
  // and cleared either on engagement, early pointerup, or a > 5px drift.
  const pressTimerRef = useRef<number | null>(null);
  const startClientRef = useRef<{ x: number; y: number } | null>(null);
  const boundaryRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const detachDocListenersRef = useRef<(() => void) | null>(null);
  const detachTouchMoveRef = useRef<(() => void) | null>(null);

  const clearPressTimer = useCallback(() => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const stopAutoscrollLoop = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const resetGesture = useCallback(() => {
    startIdRef.current = null;
    startIdxRef.current = null;
    pointerIdRef.current = null;
    brushRef.current = null;
    originalRef.current = new Map();
    paintedRangeRef.current = null;
    startClientRef.current = null;
    clearPressTimer();
    stopAutoscrollLoop();
    if (boundaryRef.current) {
      boundaryRef.current.removeAttribute('data-paint-engaged');
      boundaryRef.current = null;
    }
    if (detachDocListenersRef.current) {
      detachDocListenersRef.current();
      detachDocListenersRef.current = null;
    }
    if (detachTouchMoveRef.current) {
      detachTouchMoveRef.current();
      detachTouchMoveRef.current = null;
    }
  }, [clearPressTimer, stopAutoscrollLoop]);

  const revertAll = useCallback(() => {
    const snapshot = originalRef.current;
    snapshot.forEach((wasSelected, id) => {
      setSelected(id, wasSelected);
    });
  }, [setSelected]);

  const applyRangeDiff = useCallback(
    (next: PaintedRange) => {
      const order = orderRef.current;
      const prev = paintedRangeRef.current;
      const brush = brushRef.current;
      if (brush === null) return;
      const brushValue = brush === 'add';
      // Cards leaving the range → revert to Original Snapshot.
      if (prev) {
        for (let i = prev.lo; i <= prev.hi; i += 1) {
          if (i < next.lo || i > next.hi) {
            const id = order[i];
            if (id === undefined) continue;
            const original = originalRef.current.get(id);
            if (original === undefined) continue;
            setSelected(id, original);
          }
        }
      }
      // Cards entering the range → adopt Brush.
      for (let i = next.lo; i <= next.hi; i += 1) {
        if (prev && i >= prev.lo && i <= prev.hi) continue;
        const id = order[i];
        if (id === undefined) continue;
        setSelected(id, brushValue);
      }
      paintedRangeRef.current = next;
    },
    [orderRef, setSelected],
  );

  // Paints the range [start, card-under-(x,y)] if the point falls on a known
  // card. Shared by the pointermove handler and the autoscroll tick so both
  // paths apply the exact same range math.
  const paintFromPoint = useCallback(
    (x: number, y: number) => {
      const startIdx = startIdxRef.current;
      if (startIdx === null) return;
      const curId = cardIdFromPoint(x, y);
      if (curId === null) return;
      const curIdx = orderRef.current.indexOf(curId);
      if (curIdx < 0) return;
      applyRangeDiff({
        lo: Math.min(startIdx, curIdx),
        hi: Math.max(startIdx, curIdx),
      });
    },
    [applyRangeDiff, orderRef],
  );

  const autoscrollTick = useCallback(() => {
    rafRef.current = null;
    if (brushRef.current === null) return;
    const { x, y } = lastClientRef.current;
    const viewportH = window.innerHeight;
    const topDistance = y;
    const bottomDistance = viewportH - y;
    let delta = 0;
    if (topDistance < AUTOSCROLL_ZONE_PX) {
      delta = -AUTOSCROLL_MAX_PX_PER_FRAME * (1 - topDistance / AUTOSCROLL_ZONE_PX);
    } else if (bottomDistance < AUTOSCROLL_ZONE_PX) {
      delta = AUTOSCROLL_MAX_PX_PER_FRAME * (1 - bottomDistance / AUTOSCROLL_ZONE_PX);
    }
    if (delta !== 0) window.scrollBy(0, delta);
    // Re-paint: the card under a stationary finger can change as the page
    // scrolls underneath it.
    paintFromPoint(x, y);
    rafRef.current = window.requestAnimationFrame(autoscrollTick);
  }, [paintFromPoint]);

  const engageAtStart = useCallback(() => {
    const startId = startIdRef.current;
    const startIdx = startIdxRef.current;
    if (startId === null || startIdx === null) return;
    const snapshot = new Map<string, boolean>();
    for (const id of orderRef.current) {
      snapshot.set(id, isSelected(id));
    }
    originalRef.current = snapshot;
    const wasSelected = snapshot.get(startId) ?? false;
    brushRef.current = wasSelected ? 'remove' : 'add';
    paintedRangeRef.current = null;
    applyRangeDiff({ lo: startIdx, hi: startIdx });
    // Flip the boundary into engaged mode so CSS can pin touch-action: none
    // and the page stops fighting our autoscroll.
    if (boundaryRef.current) {
      boundaryRef.current.setAttribute('data-paint-engaged', 'true');
    }
  }, [applyRangeDiff, isSelected, orderRef]);

  const handleMove = useCallback(
    (e: PointerEvent) => {
      if (startIdRef.current === null || startIdxRef.current === null) return;
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      lastClientRef.current = { x: e.clientX, y: e.clientY };
      // Pre-engagement on touch: a > 5px drift before the 250ms timer fires
      // means the user is trying to scroll, not long-press. Cancel the timer
      // and abandon the gesture — pointerup/cancel will tear down the rest.
      if (brushRef.current === null && pressTimerRef.current !== null) {
        const start = startClientRef.current;
        if (start) {
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          if (Math.hypot(dx, dy) > TOUCH_MOVE_CANCEL_PX) {
            clearPressTimer();
          }
        }
        return;
      }
      if (brushRef.current === null) {
        engageAtStart();
      }
      paintFromPoint(e.clientX, e.clientY);
    },
    [clearPressTimer, engageAtStart, paintFromPoint],
  );

  const handleUp = useCallback(
    (e: PointerEvent) => {
      if (startIdRef.current === null) return;
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      const engaged = brushRef.current !== null;
      if (engaged) {
        // Engaged gesture → suppress the trailing synthetic click so the
        // Start Card isn't double-toggled by its panel's onClick.
        suppressClickRef.current = true;
      }
      // Zero-move release is a no-op for the hook — the browser's trailing
      // synthetic click fires through to the Character Card's existing
      // onClick, which already calls `toggleDelete`. That preserves today's
      // single-click behaviour without risking a double-toggle.
      resetGesture();
    },
    [resetGesture],
  );

  const handleCancel = useCallback(
    (e: PointerEvent) => {
      if (startIdRef.current === null) {
        resetGesture();
        return;
      }
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
      if (brushRef.current !== null) {
        revertAll();
      }
      resetGesture();
    },
    [resetGesture, revertAll],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const id = cardIdFromTarget(e.target);
      if (!id) return;
      const idx = orderRef.current.indexOf(id);
      if (idx < 0) return;
      startIdRef.current = id;
      startIdxRef.current = idx;
      pointerIdRef.current = e.pointerId;
      brushRef.current = null;
      originalRef.current = new Map();
      paintedRangeRef.current = null;
      startClientRef.current = { x: e.clientX, y: e.clientY };
      lastClientRef.current = { x: e.clientX, y: e.clientY };
      boundaryRef.current = e.currentTarget;
      // Clear any leftover suppress flag. If the previous gesture released
      // outside the boundary and the browser never fired a trailing click,
      // the flag could be stuck true and would otherwise swallow the next
      // real click.
      suppressClickRef.current = false;

      // Document-level listeners (not pointer-capture) so the gesture keeps
      // flowing if the pointer leaves the boundary — and stays portable to
      // JSDOM, which doesn't implement setPointerCapture.
      if (detachDocListenersRef.current) {
        detachDocListenersRef.current();
      }
      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
      document.addEventListener('pointercancel', handleCancel);
      detachDocListenersRef.current = () => {
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
        document.removeEventListener('pointercancel', handleCancel);
      };

      // Touch: gate engagement behind a 250ms long-press so short taps fall
      // through to the panel's onClick (zero-move toggle) and vertical
      // swipes scroll the page. Mouse/pen keep today's instant-engage feel.
      // The autoscroll rAF loop is touch-only, so kicking it off here — in
      // the one branch that knows it's touch — lets us drop an isTouchRef.
      clearPressTimer();
      if (e.pointerType === 'touch') {
        pressTimerRef.current = window.setTimeout(() => {
          pressTimerRef.current = null;
          engageAtStart();
          // Scroll Preventer: iOS Safari latches the scroll decision at
          // touchstart from the touch-action value at that instant; a later
          // `touch-action: none` flip is ignored. preventDefault on a
          // non-passive touchmove is the only mid-gesture escape hatch.
          // Attached at engagement (not pointerdown) so the pre-engagement
          // window pays no non-passive-listener tax and cannot leak across
          // gestures.
          const blockTouchMove = (ev: TouchEvent) => {
            ev.preventDefault();
          };
          document.addEventListener('touchmove', blockTouchMove, { passive: false });
          detachTouchMoveRef.current = () => {
            document.removeEventListener('touchmove', blockTouchMove);
          };
          if (rafRef.current === null) {
            rafRef.current = window.requestAnimationFrame(autoscrollTick);
          }
        }, TOUCH_LONG_PRESS_MS);
      }
    },
    [
      autoscrollTick,
      clearPressTimer,
      enabled,
      engageAtStart,
      handleCancel,
      handleMove,
      handleUp,
      orderRef,
    ],
  );

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Mid-gesture unmount: tear everything down via the shared reset path so
  // the boundary attribute, document listeners, rAF loop, and long-press
  // timer all clear together — a partial teardown could leak state.
  useEffect(() => {
    return resetGesture;
  }, [resetGesture]);

  return {
    onPointerDown,
    onClickCapture,
  };
}

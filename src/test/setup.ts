import { vi } from 'vitest';
import { Global as RechartsGlobal } from 'recharts';

// Recharts components default `isAnimationActive: 'auto'`, which resolves via
// `!Global.isSsr`. Flipping isSsr in tests makes JavascriptAnimate skip its
// setTimeout-driven state updates — otherwise those fire outside act() and
// produce "update to AnimationManager inside a test was not wrapped in act(...)".
RechartsGlobal.isSsr = true;

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Recharts' ResponsiveContainer reads getBoundingClientRect() on mount and uses
// it to size the chart. jsdom returns all zeros, which overwrites the seeded
// initialDimension and trips the "width(0) and height(0) of chart" warning.
// Give every element a positive default rect so charts get real dimensions.
const DEFAULT_RECT: DOMRect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 320,
  bottom: 200,
  width: 320,
  height: 200,
  toJSON: () => ({}),
};
Element.prototype.getBoundingClientRect = function (): DOMRect {
  return { ...DEFAULT_RECT };
};

class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.IntersectionObserver =
  IntersectionObserverMock as unknown as typeof IntersectionObserver;

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 100,
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 100,
});

/**
 * Single-source toast copy for the character lookup flow. Centralized so
 * future copy tweaks (e.g. adding a "must also be Lv-eligible" caveat
 * once we observe real upstream behavior) are a one-line edit.
 *
 * The not-found message explicitly explains the upstream constraint
 * inherited from Nexon's `id=weekly` weekly-ranking index: a character
 * must have logged in within the rolling weekly window to appear. This
 * keeps users with stale or brand-new mules from assuming the lookup is
 * broken when the character simply isn't in this week's ranking yet.
 */
export const CHARACTER_LOOKUP_COPY = {
  success: {
    title: 'Character found',
  },
  notFound: {
    title: 'Character not found',
    description:
      "This character isn't in this week's ranking. They must have logged in within the last week to appear in the weekly ranking — log in and try again.",
  },
  lookupFailed: {
    title: 'Lookup failed',
    description: 'Could not reach the lookup service. Please try again.',
  },
} as const;

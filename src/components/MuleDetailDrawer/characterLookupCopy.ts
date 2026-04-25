/**
 * Toast copy for the character lookup flow.
 *
 * The not-found description names the weekly-ranking constraint inherited
 * from Nexon's `id=weekly` index — a character must have logged in within
 * the rolling weekly window to appear. Without this, users with stale or
 * brand-new mules assume the lookup itself is broken.
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

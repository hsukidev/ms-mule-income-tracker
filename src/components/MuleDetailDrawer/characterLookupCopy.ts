export const CHARACTER_LOOKUP_COPY = {
  success: {
    title: 'Character found',
  },
  notFound: {
    title: 'Character not found',
    description: 'Unable to locate character.',
  },
  lookupFailed: {
    title: 'Lookup failed',
    description: 'Could not reach the lookup service. Please try again.',
  },
} as const;

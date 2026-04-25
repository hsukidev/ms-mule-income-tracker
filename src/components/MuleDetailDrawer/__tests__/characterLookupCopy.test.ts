import { describe, expect, it } from 'vitest';
import { CHARACTER_LOOKUP_COPY } from '../characterLookupCopy';

describe('characterLookupCopy', () => {
  it('not-found description explicitly mentions the weekly-ranking constraint', () => {
    const description = CHARACTER_LOOKUP_COPY.notFound.description.toLowerCase();
    expect(description).toMatch(/weekly/);
    expect(description).toMatch(/week/);
  });

  it('not-found description is distinct from the generic lookup-failed description', () => {
    expect(CHARACTER_LOOKUP_COPY.notFound.description).not.toBe(
      CHARACTER_LOOKUP_COPY.lookupFailed.description,
    );
  });

  it('generic lookup-failed description does NOT mention the weekly-ranking constraint', () => {
    const description = CHARACTER_LOOKUP_COPY.lookupFailed.description.toLowerCase();
    expect(description).not.toMatch(/weekly/);
  });

  it('exposes a non-empty title for each toast variant', () => {
    expect(CHARACTER_LOOKUP_COPY.success.title).not.toBe('');
    expect(CHARACTER_LOOKUP_COPY.notFound.title).not.toBe('');
    expect(CHARACTER_LOOKUP_COPY.lookupFailed.title).not.toBe('');
  });
});

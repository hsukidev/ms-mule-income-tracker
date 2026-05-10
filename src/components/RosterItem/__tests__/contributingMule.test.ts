import { describe, expect, it } from 'vitest';
import { isContributingMule } from '../contributingMule';

describe('isContributingMule', () => {
  it('returns true for active mule with weeklyCount > 0', () => {
    expect(isContributingMule({ active: true }, { weeklyCount: 1, dailyCount: 0 })).toBe(true);
  });

  it('returns true for active mule with dailyCount > 0', () => {
    expect(isContributingMule({ active: true }, { weeklyCount: 0, dailyCount: 1 })).toBe(true);
  });

  it('returns false for active mule with only monthly bosses (weekly=0, daily=0)', () => {
    // Regression-preventer: monthly cadence is excluded from the contribution
    // sum per Monthly Income Regression. Active + monthly-only earns 0 meso
    // this week and must render in dim, matching List View.
    expect(isContributingMule({ active: true }, { weeklyCount: 0, dailyCount: 0 })).toBe(false);
  });

  it('returns false for inactive mule with weekly + daily bosses', () => {
    expect(isContributingMule({ active: false }, { weeklyCount: 5, dailyCount: 3 })).toBe(false);
  });

  it('returns false for active mule with empty slate (weeklyCount = dailyCount = 0)', () => {
    expect(isContributingMule({ active: true }, { weeklyCount: 0, dailyCount: 0 })).toBe(false);
  });
});

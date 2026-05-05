export type Release = {
  date: string;
  version: string;
  headline?: string;
  changes: string[];
};

export const releases: Release[] = [
  {
    date: '2026-05-05',
    version: '1.2.0',
    changes: [
      'Hide opposite cadence cells when a filter is selected (e.g. hide weekly cells when daily filter selected)',
      'Hide Extreme difficulty when daily filter is selected',
      'Restore the browser tab title when navigating away from the changelog page',
      'Re-position density toggle',
      'Add "Home" navitem for narrow screen nav drawer',
      'Users can now import/export their data via Settings > Data Management',
      'Users can now add notes for each mule in the details drawer',
      'Re-position world select dropdown',
    ],
  },
  {
    date: '2026-05-03',
    version: '1.1.0',
    changes: [
      'Enforce weekly crystal cap to calculate top 180 crystal prices only',
      'Drop lowest value bosses to retain 180 cap. Shown in info icon tooltip next to mule income',
      'Restore sticky boss-difficulty header on the matrix at normal drawer widths',
    ],
  },
  {
    date: '2026-04-29',
    version: '1.0.0',
    headline: 'Client-side routing arrives, plus a dedicated changelog page',
    changes: ['Initial release'],
  },
];

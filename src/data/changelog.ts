export type Release = {
  date: string;
  headline?: string;
  changes: string[];
};

export const releases: Release[] = [
  {
    date: '2026-05-02',
    headline: 'Client-side routing arrives, plus a dedicated changelog page',
    changes: [
      'Migrated the app to TanStack Router with file-based routing.',
      'Moved the existing dashboard to the "/" route.',
      'Added a "/changelog" page that lists recent releases as dated cards.',
    ],
  },
];

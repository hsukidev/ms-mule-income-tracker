export type CadenceFilter = 'All' | 'Weekly' | 'Daily';
export type PresetKey = 'CRA' | 'CTENE';

interface MatrixToolbarProps {
  filter: CadenceFilter;
  onFilterChange: (next: CadenceFilter) => void;
  /** Slice 4+: unused here. Declared now so the API is stable. */
  activePresets: ReadonlySet<PresetKey>;
  /** Slice 4+: unused here. Declared now so the API is stable. */
  onTogglePreset: (preset: PresetKey) => void;
  /** Slice 4+: unused here. Declared now so the API is stable. */
  weeklyCount: number;
  /** Slice 4+: unused here. Declared now so the API is stable. */
  onReset: () => void;
}

function CadenceIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      style={{ marginRight: 4 }}
    >
      {children}
    </svg>
  );
}

const CADENCES: ReadonlyArray<{ value: CadenceFilter; icon: React.ReactNode }> = [
  { value: 'All', icon: null },
  {
    value: 'Weekly',
    icon: (
      <CadenceIcon>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </CadenceIcon>
    ),
  },
  {
    value: 'Daily',
    icon: (
      <CadenceIcon>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </CadenceIcon>
    ),
  },
];

export function MatrixToolbar({ filter, onFilterChange }: MatrixToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="d-c-toggle" role="group" aria-label="Cadence filter">
        {CADENCES.map(({ value, icon }) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'on' : ''}
            onClick={() => onFilterChange(value)}
          >
            {icon}
            {value}
          </button>
        ))}
      </div>
      {/* Right-side slot reserved for preset toggles, count, and reset in
          later slices — intentionally empty in this slice. */}
      <div aria-hidden />
    </div>
  );
}

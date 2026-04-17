import { useState } from 'react';
import { PieChart, Pie, Cell, Sector } from 'recharts';
import type { Mule } from '../types';
import { computeMuleIncome } from '../modules/income';
import { useFormatPreference } from '../modules/income-hooks';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from './ui/chart';

const CHART_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

interface ChartDataItem {
  name: string;
  value: number;
  formatted: string;
  muleId: string;
  fill: string;
}

interface IncomePieChartProps {
  mules: Mule[];
  onSliceClick?: (muleId: string) => void;
}

interface ActiveSectorProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

function ActiveSector(props: unknown) {
  const p = props as ActiveSectorProps;
  return (
    <g style={{ filter: `drop-shadow(0 0 8px ${p.fill})` }}>
      <Sector
        cx={p.cx}
        cy={p.cy}
        innerRadius={p.innerRadius}
        outerRadius={p.outerRadius + 6}
        startAngle={p.startAngle}
        endAngle={p.endAngle}
        fill={p.fill}
      />
    </g>
  );
}

export function IncomePieChart({ mules, onSliceClick }: IncomePieChartProps) {
  const { abbreviated } = useFormatPreference();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const data: ChartDataItem[] = mules
    .filter((m) => m.selectedBosses.length > 0)
    .map((m, i) => {
      const { raw, formatted } = computeMuleIncome(m.selectedBosses, abbreviated);
      return {
        name: m.name || 'Unnamed Mule',
        value: raw,
        formatted,
        muleId: m.id,
        fill: CHART_VARS[i % CHART_VARS.length],
      };
    });

  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-center px-4">
        <div className="max-w-[220px] flex flex-col items-center gap-2">
          <div
            aria-hidden
            className="h-16 w-16 rounded-full border border-dashed border-border/60"
            style={{
              background:
                'radial-gradient(closest-side, oklch(from var(--maple) l c h / 0.12), transparent 70%)',
            }}
          />
          <p className="font-display italic text-sm text-muted-foreground">
            No crystals tallied yet
          </p>
          <p className="font-sans text-xs text-muted-foreground/70">
            Add a mule and pick its bosses to light the ledger.
          </p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hoveredName =
    activeIndex !== undefined ? data[activeIndex]?.name : undefined;
  const hoveredValue =
    activeIndex !== undefined ? data[activeIndex]?.formatted : undefined;

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((item) => [
      item.muleId,
      { label: item.name, color: item.fill },
    ])
  );

  return (
    <div className="relative">
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={66}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
            activeIndex={activeIndex}
            activeShape={ActiveSector as never}
            onMouseEnter={(_e, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
            onClick={(_event, index) => {
              const muleId = data[index]?.muleId;
              if (muleId != null) onSliceClick?.(muleId);
            }}
            style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ChartContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-sans text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
          {hoveredName ? 'Mule' : 'Total'}
        </span>
        <span className="font-display text-base font-semibold max-w-[140px] truncate mt-0.5">
          {hoveredName ?? 'Ledger'}
        </span>
        <span className="font-mono-nums text-sm text-[var(--gold)] mt-1">
          {hoveredValue ?? (abbreviated
            ? formatCompact(total)
            : total.toLocaleString())}
        </span>
      </div>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

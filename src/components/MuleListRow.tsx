import { memo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, FileText, GripVertical, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIncome } from '../modules/income';
import { formatMeso } from '../utils/meso';
import { formatDroppedSlots } from '../data/muleBossSlate';
import type { Mule } from '../types';
import type { RosterRowMetrics } from './rosterRowMetrics';
import { CharacterAvatar } from './CharacterAvatar';
import { MetricTooltip } from './MetricTooltip';
import weeklyCrystalPng from '../assets/weekly-crystal.png';
import dailyCrystalPng from '../assets/daily-crystal.png';

interface MuleListRowProps {
  mule: Mule;
  metrics: RosterRowMetrics;
  postCapIncomeMeso: number;
  onClick: (id: string) => void;
  bulkMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  isPaintEngaged?: boolean;
  /** When true, override `useIncome.abbreviated` and force the abbreviated meso
   * format. Lifted to RosterListView so a single matchMedia subscription
   * decides for the whole roster. */
  forceAbbreviated?: boolean;
}

export const MONO = 'Geist Mono, monospace';
const DESTRUCTIVE = 'var(--destructive)';
const destructiveAlpha = (pct: number) =>
  `color-mix(in oklab, var(--destructive) ${pct}%, transparent)`;

const HANDLE_STRETCH_STYLE: React.CSSProperties = { width: '100%', height: '100%' };
const HANDLE_ICON_STYLE: React.CSSProperties = {
  width: 'var(--row-handle-icon, 18px)',
  height: 'var(--row-handle-icon, 18px)',
};

const METRIC_ICON_STYLE: React.CSSProperties = {
  width: 'var(--row-metric-icon, 18px)',
  height: 'var(--row-metric-icon, 18px)',
  objectFit: 'contain',
  display: 'inline-block',
  flexShrink: 0,
};

const METRIC_VALUE_STYLE: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 'var(--row-eyebrow-value-size, 16px)',
  fontWeight: 700,
  marginLeft: 6,
};

const LEVEL_PILL_STYLE: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 'var(--row-level-size, 11px)',
  letterSpacing: '0.1em',
  color: 'var(--muted-raw, var(--muted-foreground))',
  padding: '2px 6px',
  borderRadius: 4,
  border: '1px solid var(--border)',
  background: 'var(--surface-2, var(--surface-raised))',
  whiteSpace: 'nowrap',
};

export const MuleListRow = memo(function MuleListRow({
  mule,
  metrics,
  postCapIncomeMeso,
  onClick,
  bulkMode = false,
  selected = false,
  onToggleSelect,
  isPaintEngaged = false,
  forceAbbreviated = false,
}: MuleListRowProps) {
  const [isPressed, setIsPressed] = useState(false);
  const handlePressStart = () => setIsPressed(true);
  const handlePressEnd = () => setIsPressed(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: mule.id,
    disabled: bulkMode,
  });
  const { abbreviated } = useIncome();
  const displayedIncome = formatMeso(postCapIncomeMeso, abbreviated || forceAbbreviated);
  const fullIncome = formatMeso(postCapIncomeMeso, false);

  function handleActivate() {
    if (bulkMode) onToggleSelect?.(mule.id);
    else onClick(mule.id);
  }

  function stopBubble(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  }

  const [notesTooltipOpen, setNotesTooltipOpen] = useState(false);
  const [droppedTooltipOpen, setDroppedTooltipOpen] = useState(false);
  const trimmedNotes = mule.notes?.trim() ?? '';
  const hasNotes = !bulkMode && trimmedNotes.length > 0;
  const droppedLines =
    !bulkMode && metrics.droppedKeys.size > 0 ? formatDroppedSlots(metrics.droppedKeys) : [];
  const isBulkSelected = bulkMode && selected;
  // Tint instead of MuleCharacterCard's 4% scale because a row is wide and
  // short — scaling warps the cell layout.
  const showPressTint = bulkMode && isPressed && !isPaintEngaged && !isBulkSelected;
  const rowStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition
      ? `${transition}, background 200ms ease-out, border-color 200ms ease-out`
      : 'background 200ms ease-out, border-color 200ms ease-out',
    opacity: mule.active ? 1 : 0.55,
    zIndex: isDragging ? 1 : undefined,
    display: 'grid',
    gridTemplateColumns: 'var(--row-handle, 24px) var(--row-avatar, 64px) auto minmax(0, 1fr)',
    alignItems: 'center',
    gap: 'var(--row-gap, 10px)',
    padding: 'var(--row-pad, 14px 18px)',
    border: '1px solid',
    borderColor: isBulkSelected
      ? DESTRUCTIVE
      : showPressTint
        ? destructiveAlpha(40)
        : 'var(--border)',
    background: isBulkSelected
      ? destructiveAlpha(10)
      : showPressTint
        ? destructiveAlpha(6)
        : 'var(--surface)',
    borderRadius: 10,
    cursor: 'pointer',
    WebkitTouchCallout: 'none',
    userSelect: 'none',
  };

  const incomeColor =
    mule.active && (metrics.weeklyCount > 0 || metrics.dailyCount > 0)
      ? 'var(--accent-raw, var(--accent))'
      : 'var(--dim, var(--surface-dim))';

  return (
    <div
      ref={setNodeRef}
      style={rowStyle}
      data-mule-row={mule.id}
      data-paint-target={mule.id}
      data-testid={`mule-row-${mule.id}`}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
    >
      {bulkMode ? (
        <span
          aria-hidden
          data-selection-indicator
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `1.5px solid ${selected ? DESTRUCTIVE : destructiveAlpha(50)}`,
            background: selected ? DESTRUCTIVE : 'transparent',
            color: selected ? 'white' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 140ms, border-color 140ms',
          }}
        >
          {selected && <Check style={{ width: 14, height: 14, strokeWidth: 3 }} />}
        </span>
      ) : (
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          onClick={stopBubble}
          className="inline-flex items-center justify-center bg-transparent border-0 p-0 cursor-grab touch-none rounded-md transition-colors text-muted-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          style={HANDLE_STRETCH_STYLE}
        >
          <GripVertical strokeWidth={2} style={HANDLE_ICON_STYLE} />
        </button>
      )}

      <CharacterAvatar
        avatarUrl={mule.avatarUrl}
        size={'var(--row-avatar, 64px)'}
        alt=""
        data-testid="card-avatar"
      />

      <div
        style={{
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--row-identity-gap, 6px)',
        }}
      >
        <div className="flex flex-row items-center gap-2">
          <span
            style={{
              color: mule.name
                ? 'var(--text, var(--foreground))'
                : 'var(--muted-raw, var(--muted-foreground))',
              fontWeight: 600,
              fontSize: 'var(--row-name-size, 17px)',
              fontStyle: mule.name ? 'normal' : 'italic',
              whiteSpace: 'nowrap',
            }}
          >
            {mule.name || 'Unnamed'}
          </span>
          <span
            data-row-class
            style={{
              color: 'var(--muted-raw, var(--muted-foreground))',
              fontFamily: MONO,
              fontSize: 'var(--row-class-size, 11px)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {mule.muleClass || 'No class'}
          </span>
          {mule.level > 0 && (
            <span data-row-level style={LEVEL_PILL_STYLE}>
              Lv.{mule.level}
            </span>
          )}
          {hasNotes && (
            <Tooltip open={notesTooltipOpen} onOpenChange={setNotesTooltipOpen}>
              <TooltipTrigger
                aria-label="Show character notes"
                closeOnClick={false}
                delay={0}
                onClick={(e) => {
                  stopBubble(e);
                  setNotesTooltipOpen(true);
                }}
                onPointerDown={stopBubble}
                onTouchStart={stopBubble}
                className="inline-flex shrink-0 items-center justify-center bg-transparent p-0 border-0 cursor-pointer text-muted-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <FileText className="size-4" aria-hidden />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs whitespace-pre-wrap wrap-anywhere normal-case tracking-normal text-[11px]"
              >
                {trimmedNotes}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--row-metric-row-gap, 14px)',
            minWidth: 0,
          }}
        >
          <span aria-label="Weekly count" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <img
              src={weeklyCrystalPng}
              alt=""
              draggable={false}
              data-row-eyebrow
              style={METRIC_ICON_STYLE}
            />
            <span style={METRIC_VALUE_STYLE}>
              <span style={{ color: 'var(--accent-raw, var(--accent))' }}>
                {metrics.weeklyCount}
              </span>
              <span
                data-row-weekly-cap
                style={{ color: 'var(--muted-raw, var(--muted-foreground))' }}
              >
                /14
              </span>
            </span>
          </span>

          <span aria-label="Daily count" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <img
              src={dailyCrystalPng}
              alt=""
              draggable={false}
              data-row-eyebrow
              style={METRIC_ICON_STYLE}
            />
            <span style={{ ...METRIC_VALUE_STYLE, color: 'var(--accent-raw, var(--accent))' }}>
              {metrics.dailyCount}
            </span>
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'right', minWidth: 0 }}>
        <div className="flex flex-row items-center justify-end gap-1.5" style={{ minWidth: 0 }}>
          <MetricTooltip ariaLabel={`Potential meso ${fullIncome}`} tooltip={fullIncome}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 'var(--row-income-size, 22px)',
                fontWeight: 600,
                color: incomeColor,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
              }}
            >
              {displayedIncome}
            </span>
          </MetricTooltip>
          {droppedLines.length > 0 && (
            <Tooltip open={droppedTooltipOpen} onOpenChange={setDroppedTooltipOpen}>
              <TooltipTrigger
                aria-label="Show bosses dropped to cap"
                closeOnClick={false}
                delay={0}
                onClick={(e) => {
                  stopBubble(e);
                  setDroppedTooltipOpen(true);
                }}
                onPointerDown={stopBubble}
                onTouchStart={stopBubble}
                className="inline-flex shrink-0 items-center justify-center bg-transparent p-0 border-0 cursor-pointer text-muted-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Info className="size-3" aria-hidden />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="flex-col items-start gap-1 normal-case text-[11px] tracking-normal"
              >
                {droppedLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div
          data-row-share
          style={{
            fontFamily: MONO,
            fontSize: 'var(--row-eyebrow-size, 11px)',
            color: 'var(--muted-raw, var(--muted-foreground))',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          <MetricTooltip ariaLabel="Share of roster" tooltip="Share of roster">
            <span>{(metrics.sharePct * 100).toFixed(1)}%</span>
            <span data-row-eyebrow style={{ marginLeft: 4 }}>
              SHARE
            </span>
          </MetricTooltip>
        </div>
      </div>
    </div>
  );
});

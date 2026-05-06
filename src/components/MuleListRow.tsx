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

interface MuleListRowProps {
  mule: Mule;
  metrics: RosterRowMetrics;
  postCapIncomeMeso: number;
  onClick: (id: string) => void;
  bulkMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const MONO = 'Geist Mono, monospace';
const DESTRUCTIVE = 'var(--destructive)';
const destructiveAlpha = (pct: number) =>
  `color-mix(in oklab, var(--destructive) ${pct}%, transparent)`;

export const MuleListRow = memo(function MuleListRow({
  mule,
  metrics,
  postCapIncomeMeso,
  onClick,
  bulkMode = false,
  selected = false,
  onToggleSelect,
}: MuleListRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mule.id,
    disabled: bulkMode,
  });
  const { abbreviated } = useIncome();
  const displayedIncome = formatMeso(postCapIncomeMeso, abbreviated);

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
  const rowStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: mule.active ? 1 : 0.55,
    zIndex: isDragging ? 1 : undefined,
    display: 'grid',
    gridTemplateColumns: '24px var(--row-avatar, 44px) 1fr auto auto auto',
    alignItems: 'center',
    gap: 'var(--row-gap, 10px)',
    padding: 'var(--row-pad, 14px 18px)',
    border: '1px solid',
    borderColor: isBulkSelected ? DESTRUCTIVE : 'var(--border)',
    background: isBulkSelected ? destructiveAlpha(10) : 'var(--surface)',
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
      data-testid={`mule-row-${mule.id}`}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      {...attributes}
      {...listeners}
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
        <span
          aria-hidden
          data-mule-row-grip
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted-raw, var(--muted-foreground))',
          }}
        >
          <GripVertical size={12} strokeWidth={1.75} />
        </span>
      )}

      <CharacterAvatar
        avatarUrl={mule.avatarUrl}
        size={'var(--row-avatar, 44px)'}
        alt=""
        data-testid="card-avatar"
      />

      <div style={{ minWidth: 0 }}>
        <div className="flex flex-row items-center gap-2" style={{ minWidth: 0 }}>
          <span
            style={{
              color: mule.name
                ? 'var(--text, var(--foreground))'
                : 'var(--muted-raw, var(--muted-foreground))',
              fontWeight: 600,
              fontSize: 'var(--mule-name-size, 14px)',
              fontStyle: mule.name ? 'normal' : 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {mule.name || 'Unnamed'}
          </span>
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
                <FileText className="size-3.5" aria-hidden />
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
        <div className="flex flex-row items-center gap-2" style={{ marginTop: 2, minWidth: 0 }}>
          <span
            style={{
              color: 'var(--muted-raw, var(--muted-foreground))',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {mule.muleClass || 'No class'}
          </span>
          {mule.level > 0 && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: 'var(--mule-level-size, 11px)',
                letterSpacing: '0.1em',
                color: 'var(--muted-raw, var(--muted-foreground))',
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--surface-2, var(--surface-raised))',
                whiteSpace: 'nowrap',
              }}
            >
              Lv.{mule.level}
            </span>
          )}
        </div>
      </div>

      <Eyebrow label="WEEKLY">
        <MetricTooltip ariaLabel="Weekly count" tooltip="Weekly" stopBubble={stopBubble}>
          <span style={{ fontFamily: MONO, color: 'var(--accent-raw, var(--accent))' }}>
            {metrics.weeklyCount}
          </span>
          <span style={{ fontFamily: MONO, color: 'var(--muted-raw, var(--muted-foreground))' }}>
            /14
          </span>
        </MetricTooltip>
      </Eyebrow>

      <Eyebrow label="DAILY">
        <MetricTooltip ariaLabel="Daily count" tooltip="Daily" stopBubble={stopBubble}>
          <span style={{ fontFamily: MONO, color: 'var(--accent-raw, var(--accent))' }}>
            {metrics.dailyCount}
          </span>
        </MetricTooltip>
      </Eyebrow>

      <div style={{ textAlign: 'right' }}>
        <div className="flex flex-row items-center justify-end gap-1.5" style={{ minWidth: 0 }}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 18,
              fontWeight: 600,
              color: incomeColor,
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {displayedIncome}
          </span>
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
          style={{
            fontFamily: MONO,
            fontSize: 9.5,
            color: 'var(--muted-raw, var(--muted-foreground))',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          <MetricTooltip
            ariaLabel="Share of roster"
            tooltip="Share of roster"
            stopBubble={stopBubble}
          >
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

function MetricTooltip({
  ariaLabel,
  tooltip,
  stopBubble,
  children,
}: {
  ariaLabel: string;
  tooltip: string;
  stopBubble: (e: React.SyntheticEvent) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        aria-label={ariaLabel}
        closeOnClick={false}
        delay={0}
        onClick={(e) => {
          stopBubble(e);
          setOpen(true);
        }}
        onPointerDown={stopBubble}
        onTouchStart={stopBubble}
        className="inline-flex items-center bg-transparent p-0 border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" className="normal-case tracking-normal text-[11px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function Eyebrow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div
        data-row-eyebrow
        style={{
          fontFamily: MONO,
          fontSize: 9.5,
          letterSpacing: '0.14em',
          color: 'var(--muted-raw, var(--muted-foreground))',
          textTransform: 'uppercase',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600 }}>{children}</div>
    </div>
  );
}

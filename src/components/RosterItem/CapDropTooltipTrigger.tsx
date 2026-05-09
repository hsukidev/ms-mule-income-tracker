import { memo, useState } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDroppedSlots, type SlateKey } from '../../data/muleBossSlate';

interface CapDropTooltipTriggerProps {
  droppedKeys: ReadonlyMap<SlateKey, number>;
}

const stopBubble = (e: React.SyntheticEvent) => e.stopPropagation();

export const CapDropTooltipTrigger = memo(function CapDropTooltipTrigger({
  droppedKeys,
}: CapDropTooltipTriggerProps) {
  const [open, setOpen] = useState(false);
  if (droppedKeys.size === 0) return null;
  const lines = formatDroppedSlots(droppedKeys);
  if (lines.length === 0) return null;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        aria-label="Show bosses dropped to cap"
        closeOnClick={false}
        delay={0}
        onClick={(e) => {
          stopBubble(e);
          setOpen(true);
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
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
});

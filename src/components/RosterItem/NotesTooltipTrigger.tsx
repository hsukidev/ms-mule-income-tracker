import { memo, useState } from 'react';
import { FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NotesTooltipTriggerProps {
  notes: string;
  iconSize?: 'sm' | 'md';
}

const ICON_CLASS: Record<NonNullable<NotesTooltipTriggerProps['iconSize']>, string> = {
  sm: 'size-3.5',
  md: 'size-4',
};

const stopBubble = (e: React.SyntheticEvent) => e.stopPropagation();

export const NotesTooltipTrigger = memo(function NotesTooltipTrigger({
  notes,
  iconSize = 'sm',
}: NotesTooltipTriggerProps) {
  const [open, setOpen] = useState(false);
  const trimmed = notes.trim();
  if (trimmed.length === 0) return null;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        aria-label="Show character notes"
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
        <FileText className={ICON_CLASS[iconSize]} aria-hidden />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs whitespace-pre-wrap wrap-anywhere normal-case tracking-normal text-[11px]"
      >
        {trimmed}
      </TooltipContent>
    </Tooltip>
  );
});

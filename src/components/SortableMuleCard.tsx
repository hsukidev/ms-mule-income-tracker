import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Mule } from '../types';
import { MuleCard } from './MuleCard';

interface SortableMuleCardProps {
  mule: Mule;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  onUpdate: (id: string, updates: Partial<Omit<Mule, 'id'>>) => void;
  onDelete: (id: string) => void;
}

export function SortableMuleCard({
  mule,
  expanded,
  onExpandChange,
  onUpdate,
  onDelete,
}: SortableMuleCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: mule.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <MuleCard
        mule={mule}
        expanded={expanded}
        onExpandChange={onExpandChange}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}
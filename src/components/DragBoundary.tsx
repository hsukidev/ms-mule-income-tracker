import type { ReactNode } from 'react';

interface DragBoundaryProps {
  isDragging: boolean;
  children: ReactNode;
}

const boundaryStyleWhenDragging: React.CSSProperties = {
  borderStyle: 'dotted',
  borderWidth: '2px',
  borderColor: 'var(--mantine-color-dimmed)',
};

export function DragBoundary({ isDragging, children }: DragBoundaryProps) {
  const style: React.CSSProperties = isDragging ? boundaryStyleWhenDragging : {};
  return <div style={style}>{children}</div>;
}

import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

type Screen = 'chooser' | 'export' | 'import' | 'confirm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataManagementDialog({ open, onOpenChange }: Props) {
  const [screen, setScreen] = useState<Screen>('chooser');

  const handleOpenChange = (next: boolean) => {
    if (!next) setScreen('chooser');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Data Management</DialogTitle>
        </DialogHeader>
        {screen === 'chooser' && (
          <div className="flex flex-col gap-2">
            <ChooserRow
              icon={<Download size={20} />}
              label="Export Data"
              description="Generate user data transfer code"
              onClick={() => setScreen('export')}
            />
            <ChooserRow
              icon={<Upload size={20} />}
              label="Import Data"
              description="Paste user data transfer code"
              onClick={() => setScreen('import')}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ChooserRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

function ChooserRow({ icon, label, description, onClick }: ChooserRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-md border border-border p-3 text-left transition-colors cursor-pointer hover:bg-muted"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

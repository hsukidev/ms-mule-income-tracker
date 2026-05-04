import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import {
  applyImport,
  decodeImport,
  summarizeImport,
  type ExportEnvelope,
  type SummaryResult,
} from '../lib/dataTransfer';
import { toast } from '../lib/toast';

type Screen = 'chooser' | 'export' | 'import' | 'confirm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataManagementDialog({ open, onOpenChange }: Props) {
  const [screen, setScreen] = useState<Screen>('chooser');
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState(false);
  const [decoded, setDecoded] = useState<ExportEnvelope | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setScreen('chooser');
      setImportCode('');
      setImportError(false);
      setDecoded(null);
    }
    onOpenChange(next);
  };

  const handleImportClick = () => {
    const result = decodeImport(importCode);
    if (!result.ok) {
      setImportError(true);
      return;
    }
    setImportError(false);
    setDecoded(result.payload);
    setScreen('confirm');
  };

  const handleApplyImport = () => {
    if (!decoded) return;
    const result = applyImport(decoded);
    if (result.ok) {
      window.location.reload();
    } else {
      toast.error('Import failed — your data was not changed.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {screen === 'confirm' ? 'Replace your data?' : 'Data Management'}
          </DialogTitle>
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
        {screen === 'import' && (
          <ImportPasteScreen
            code={importCode}
            error={importError}
            onCodeChange={(next) => {
              setImportCode(next);
              if (importError) setImportError(false);
            }}
            onCancel={() => {
              setScreen('chooser');
              setImportCode('');
              setImportError(false);
            }}
            onImport={handleImportClick}
          />
        )}
        {screen === 'confirm' && decoded && (
          <ConfirmScreen
            summary={summarizeImport(decoded)}
            onBack={() => setScreen('import')}
            onApply={handleApplyImport}
          />
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

interface ImportPasteScreenProps {
  code: string;
  error: boolean;
  onCodeChange: (next: string) => void;
  onCancel: () => void;
  onImport: () => void;
}

function ImportPasteScreen({
  code,
  error,
  onCodeChange,
  onCancel,
  onImport,
}: ImportPasteScreenProps) {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        rows={6}
        className="font-mono text-xs"
        placeholder="Paste your YABI transfer code here"
        aria-invalid={error || undefined}
      />
      {error && <p className="text-sm text-destructive">Invalid YABI transfer code</p>}
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onImport}>Import</Button>
      </div>
    </div>
  );
}

interface ConfirmScreenProps {
  summary: SummaryResult;
  onBack: () => void;
  onApply: () => void;
}

function ConfirmScreen({ summary, onBack, onApply }: ConfirmScreenProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Importing will replace all your current data. This cannot be undone.
      </p>
      <SummarySection label="Before" counts={summary.before} />
      <SummarySection label="After" counts={summary.after} />
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onApply}>Replace and reload</Button>
      </div>
    </div>
  );
}

interface SummarySectionProps {
  label: string;
  counts: SummaryResult['before'];
}

function SummarySection({ label, counts }: SummarySectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-center font-mono text-xs text-muted-foreground">─── {label} ───</p>
      {counts.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No mules</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {counts.map((c) => (
            <li key={c.worldLabel} className="flex justify-between text-sm text-foreground">
              <span>{c.worldLabel}</span>
              <span className="text-muted-foreground">{c.count} mules</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

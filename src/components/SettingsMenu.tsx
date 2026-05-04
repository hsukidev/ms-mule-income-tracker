import { useState } from 'react';
import { Settings, Database } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { DataManagementDialog } from './DataManagementDialog';

type ActiveDialog = 'data-management' | null;

export function SettingsMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          className="flex size-8 items-center justify-center rounded-md transition-colors cursor-pointer"
          style={{ color: 'var(--muted-raw, var(--muted-foreground))' }}
          aria-label="Settings"
        >
          <Settings size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setActiveDialog('data-management')}>
            <Database />
            Data Management
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DataManagementDialog
        open={activeDialog === 'data-management'}
        onOpenChange={(open) => setActiveDialog(open ? 'data-management' : null)}
      />
    </>
  );
}

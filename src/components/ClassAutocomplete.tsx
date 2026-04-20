import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

interface Props {
  id?: string;
  value: string;
  options: readonly string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ClassAutocomplete({
  id,
  value,
  options,
  onSelect,
  placeholder,
  className,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => (draft ? options.filter((o) => o.toLowerCase().includes(draft.toLowerCase())) : options),
    [draft, options],
  );

  function handleSelect(option: string) {
    setDraft(option);
    setOpen(false);
    onSelect(option);
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          setDraft(e.currentTarget.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          if (draft === '') {
            onSelect('');
          } else {
            const match = options.find((o) => o.toLowerCase() === draft.toLowerCase());
            if (match) {
              setDraft(match);
              if (match !== value) onSelect(match);
            } else {
              setDraft(value);
            }
          }
        }}
      />
      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border/60 bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden"
        >
          {filtered.map((o) => (
            <li
              key={o}
              role="option"
              aria-selected={o === draft}
              onClick={() => handleSelect(o)}
              className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent/40"
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

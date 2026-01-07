import { Label } from '@/components/ui/label';

export type DataMode = 'daily' | 'monthly';

interface ModeSelectorProps {
  selected: DataMode;
  onChange: (mode: DataMode) => void;
}

const modes: { value: DataMode; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
];

export function ModeSelector({ selected, onChange }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Data Mode</Label>
      <div className="flex gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              selected === mode.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}


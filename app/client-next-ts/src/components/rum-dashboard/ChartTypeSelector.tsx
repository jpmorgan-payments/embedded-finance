import { Label } from '@/components/ui/label';

import { type ChartType } from './RumDashboard';

interface ChartTypeSelectorProps {
  selected: ChartType;
  onChange: (type: ChartType) => void;
}

const chartTypes: { value: ChartType; label: string }[] = [
  { value: 'area', label: 'Area' },
  { value: 'line', label: 'Line' },
  { value: 'bar', label: 'Bar' },
];

export function ChartTypeSelector({
  selected,
  onChange,
}: ChartTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Chart Type</Label>
      <div className="flex gap-2">
        {chartTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              selected === type.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}

import { Label } from '@/components/ui/label';

import { type MetricType } from './RumDashboard';

interface MetricSelectorProps {
  selected: MetricType[];
  onChange: (metrics: MetricType[]) => void;
}

const availableMetrics: { value: MetricType; label: string }[] = [
  { value: 'traffic', label: 'Traffic' },
  { value: 'clones', label: 'Clones' },
  { value: 'referrers', label: 'Referrers' },
  { value: 'monthly', label: 'Monthly' },
];

export function MetricSelector({ selected, onChange }: MetricSelectorProps) {
  const toggleMetric = (metric: MetricType) => {
    if (selected.includes(metric)) {
      onChange(selected.filter((m) => m !== metric));
    } else {
      onChange([...selected, metric]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Metrics</Label>
      <div className="flex flex-wrap gap-2">
        {availableMetrics.map((metric) => (
          <button
            key={metric.value}
            type="button"
            onClick={() => toggleMetric(metric.value)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              selected.includes(metric.value)
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-accent'
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>
    </div>
  );
}

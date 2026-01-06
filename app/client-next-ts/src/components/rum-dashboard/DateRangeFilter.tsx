import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (range: { start: string | null; end: string | null }) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onChange,
}: DateRangeFilterProps) {
  return (
    <div className="space-y-2">
      <Label>Date Range</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="date"
            placeholder="Start date"
            value={startDate || ''}
            onChange={(e) =>
              onChange({
                start: e.target.value || null,
                end: endDate,
              })
            }
          />
        </div>
        <div className="flex-1">
          <Input
            type="date"
            placeholder="End date"
            value={endDate || ''}
            onChange={(e) =>
              onChange({
                start: startDate,
                end: e.target.value || null,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

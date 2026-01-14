import { useMemo } from 'react';
import { format, startOfMonth, startOfYear, subDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangePresetsProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (range: { start: string | null; end: string | null }) => void;
}

type PresetType = 'mtd' | 'ytd' | 'last7' | 'last30' | 'last90' | 'custom';

export function DateRangePresets({
  startDate,
  endDate,
  onChange,
}: DateRangePresetsProps) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const presets: Array<{
    type: PresetType;
    label: string;
    getRange: () => { start: string; end: string };
  }> = useMemo(
    () => [
      {
        type: 'mtd',
        label: 'MTD',
        getRange: () => ({
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: todayStr,
        }),
      },
      {
        type: 'ytd',
        label: 'YTD',
        getRange: () => ({
          start: format(startOfYear(today), 'yyyy-MM-dd'),
          end: todayStr,
        }),
      },
      {
        type: 'last7',
        label: 'Last 7 Days',
        getRange: () => ({
          start: format(subDays(today, 7), 'yyyy-MM-dd'),
          end: todayStr,
        }),
      },
      {
        type: 'last30',
        label: 'Last 30 Days',
        getRange: () => ({
          start: format(subDays(today, 30), 'yyyy-MM-dd'),
          end: todayStr,
        }),
      },
      {
        type: 'last90',
        label: 'Last 90 Days',
        getRange: () => ({
          start: format(subDays(today, 90), 'yyyy-MM-dd'),
          end: todayStr,
        }),
      },
    ],
    [today, todayStr]
  );

  const activePreset = useMemo(() => {
    if (!startDate || !endDate) return 'mtd';

    for (const preset of presets) {
      const range = preset.getRange();
      if (startDate === range.start && endDate === range.end) {
        return preset.type;
      }
    }
    return 'custom';
  }, [startDate, endDate, presets]);

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const range = preset.getRange();
    onChange({ start: range.start, end: range.end });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Date Range Presets</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.type}
              type="button"
              variant={activePreset === preset.type ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label>Custom Date Range</Label>
        <div className="mt-2 flex gap-2">
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
    </div>
  );
}

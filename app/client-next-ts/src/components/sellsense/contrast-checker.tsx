'use client';

import { useMemo } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { calculateContrast } from '@/lib/color-contrast';
import { cn } from '@/lib/utils';

interface ContrastCheckerProps {
  foreground: string;
  background: string;
  label?: string;
  textSize?: 'normal' | 'large';
  showRatio?: boolean;
  compact?: boolean;
}

export function ContrastChecker({
  foreground,
  background,
  label = 'Contrast',
  textSize = 'normal',
  showRatio = true,
  compact = false,
}: ContrastCheckerProps) {
  const result = useMemo(
    () => calculateContrast(foreground, background),
    [foreground, background]
  );

  if (!result) {
    return (
      <div className="text-xs text-gray-500">Invalid color combination</div>
    );
  }

  const { ratio, passes, level } = result;

  // Determine which standard to check based on text size
  const standard = textSize === 'large' ? 'large' : 'normal';
  const passesAA = passes.AA[standard];
  const passesAAA = passes.AAA[standard];

  if (compact) {
    const icon = passesAA ? (
      <Check className="h-3 w-3" />
    ) : (
      <X className="h-3 w-3" />
    );

    return (
      <Badge
        className={cn(
          'flex items-center gap-1 border-0 text-xs',
          level === 'AAA' && 'bg-green-100 text-green-800',
          level === 'AA' && 'bg-amber-100 text-amber-800',
          level === 'Fail' && 'bg-red-100 text-red-800'
        )}
      >
        {icon}
        {showRatio && `${ratio}:1`}
      </Badge>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {showRatio && (
          <span className="font-mono text-sm text-gray-600">
            Ratio: {ratio}:1
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          {passesAA ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span className={cn(passesAA ? 'text-green-700' : 'text-red-700')}>
            AA ({textSize === 'large' ? '3:1' : '4.5:1'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {passesAAA ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span className={cn(passesAAA ? 'text-green-700' : 'text-red-700')}>
            AAA ({textSize === 'large' ? '4.5:1' : '7:1'})
          </span>
        </div>
      </div>

      {/* Live Preview */}
      <div
        className="rounded border border-gray-300 p-2 text-center text-sm"
        style={{
          backgroundColor: background,
          color: foreground,
        }}
      >
        Sample Text
      </div>

      {/* Color Swatches */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div
            className="h-4 w-4 rounded border border-gray-300"
            style={{ backgroundColor: foreground }}
            title="Foreground color"
          />
          <span className="text-xs text-gray-600">FG</span>
        </div>
        <span className="text-xs text-gray-400">→</span>
        <div className="flex items-center gap-1">
          <div
            className="h-4 w-4 rounded border border-gray-300"
            style={{ backgroundColor: background }}
            title="Background color"
          />
          <span className="text-xs text-gray-600">BG</span>
        </div>
      </div>

      {result.recommendation && (
        <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>{result.recommendation}</span>
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import {
  BUTTON_RADIUS_PRESETS,
  COMPACT_THEME_HINTS,
  COMPACT_THEME_LABELS,
  deriveCompactTheme,
  getExpandedKeysForCompact,
  RADIUS_PRESETS,
  SIMPLE_THEME_KEYS,
  type CompactThemeKey,
  type CompactThemeTokens,
} from './compact-theme-tokens';

const FONT_OPTIONS = [
  'Open Sans',
  'Inter',
  'Geist',
  'Manrope',
  'Roboto',
  'Amplitude',
  'Arial',
  'Georgia',
];

interface ThemeSimpleModePanelProps {
  mergedTheme: EBThemeVariables;
  onCompactChange: (key: CompactThemeKey, value: string) => void;
}

type SchemaHotspot = CompactThemeKey;

function CartoonThemeSchema({
  compact,
  active,
  onSelect,
}: {
  compact: CompactThemeTokens;
  active: SchemaHotspot | null;
  onSelect: (key: CompactThemeKey) => void;
}) {
  const is = (key: CompactThemeKey) => active === key;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-orange-50 to-sky-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-600" />
        <p className="text-xs font-semibold text-gray-800">
          Theme map — tap a part to edit it
        </p>
      </div>

      {/* Cartoon “app window” */}
      <div
        className="relative mx-auto max-w-sm rounded-2xl border-2 border-gray-800 bg-white p-3 shadow-[4px_4px_0_0_#1f2937]"
        style={{ fontFamily: compact.fontFamily }}
      >
        {/* Title bar */}
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span
            className={cn(
              'ml-2 text-[11px] font-bold tracking-wide text-gray-700 transition',
              is('fontFamily') &&
                'rounded bg-violet-100 px-1 text-violet-800 ring-2 ring-violet-400'
            )}
          >
            Your app
          </span>
        </div>

        {/* Card surface with border */}
        <button
          type="button"
          onClick={() => onSelect('borderColor')}
          className={cn(
            'mb-3 w-full border-2 bg-gray-50 p-3 text-left transition',
            is('borderColor')
              ? 'ring-2 ring-sky-500 ring-offset-2'
              : 'hover:ring-2 hover:ring-sky-300'
          )}
          style={{
            borderColor: compact.borderColor,
            borderRadius: compact.borderRadius,
          }}
          aria-label="Edit borders and corner roundness"
        >
          <p
            className={cn(
              'mb-1 text-xs font-semibold text-gray-800',
              is('fontFamily') &&
                'underline decoration-violet-400 decoration-wavy'
            )}
          >
            Hello there!
          </p>
          <p className="text-[11px] text-gray-500">
            Borders &amp; corners live on cards like this.
          </p>
        </button>

        {/* Buttons row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect('primaryColor')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold text-white shadow-[2px_2px_0_0_#1f2937] transition',
              is('primaryColor') && 'ring-2 ring-teal-500 ring-offset-2'
            )}
            style={{
              backgroundColor: compact.primaryColor,
              borderRadius: compact.buttonBorderRadius,
            }}
            aria-label="Edit brand color"
          >
            Brand button
          </button>

          <button
            type="button"
            onClick={() => onSelect('buttonBorderRadius')}
            className={cn(
              'border-2 bg-white px-3 py-1.5 text-xs font-semibold transition',
              is('buttonBorderRadius') && 'ring-2 ring-orange-400 ring-offset-2'
            )}
            style={{
              borderColor: compact.primaryColor,
              color: compact.primaryColor,
              borderRadius: compact.buttonBorderRadius,
            }}
            aria-label="Edit button shape"
          >
            Shape
          </button>

          <button
            type="button"
            onClick={() => onSelect('destructiveColor')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold text-white shadow-[2px_2px_0_0_#1f2937] transition',
              is('destructiveColor') && 'ring-2 ring-red-400 ring-offset-2'
            )}
            style={{
              backgroundColor: compact.destructiveColor,
              borderRadius: compact.buttonBorderRadius,
            }}
            aria-label="Edit destructive color"
          >
            Delete
          </button>
        </div>

        {/* Focus ring demo — derived from brand color */}
        <button
          type="button"
          onClick={() => onSelect('primaryColor')}
          className={cn(
            'mt-3 w-full border border-dashed border-gray-300 bg-white px-2 py-2 text-left text-[11px] text-gray-600 transition',
            is('primaryColor') && 'ring-4'
          )}
          style={{
            borderRadius: compact.borderRadius,
            boxShadow: is('primaryColor')
              ? `0 0 0 3px ${compact.primaryColor}`
              : `0 0 0 2px ${compact.primaryColor}55`,
          }}
          aria-label="Focus outline uses brand color"
        >
          Focus outline follows brand color
        </button>

        {/* Floating legend pins */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(
            [
              ['primaryColor', 'Brand'],
              ['destructiveColor', 'Delete'],
              ['borderColor', 'Border'],
              ['fontFamily', 'Font'],
              ['borderRadius', 'Corners'],
              ['buttonBorderRadius', 'Buttons'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-medium transition',
                is(key)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-gray-500">
        Changing a simple setting updates several design tokens under the hood.
      </p>
    </div>
  );
}

export function ThemeSimpleModePanel({
  mergedTheme,
  onCompactChange,
}: ThemeSimpleModePanelProps) {
  const compact = useMemo(() => deriveCompactTheme(mergedTheme), [mergedTheme]);
  const [activeKey, setActiveKey] = useState<CompactThemeKey | null>(
    'primaryColor'
  );

  const fontSelectValue = FONT_OPTIONS.includes(compact.fontFamily)
    ? compact.fontFamily
    : (FONT_OPTIONS.find((f) =>
        compact.fontFamily.toLowerCase().startsWith(f.toLowerCase())
      ) ?? compact.fontFamily);

  const renderColorField = (key: CompactThemeKey) => {
    const value = compact[key];
    const expandedCount = getExpandedKeysForCompact(key).length;
    return (
      <div
        id={`simple-${key}`}
        className={cn(
          'space-y-2 rounded-lg border p-3 transition',
          activeKey === key
            ? 'border-amber-300 bg-amber-50/70'
            : 'border-gray-200 bg-white'
        )}
        onFocusCapture={() => setActiveKey(key)}
      >
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor={`compact-${key}`}
            className="text-xs font-medium text-gray-900"
          >
            {COMPACT_THEME_LABELS[key]}
          </Label>
          <span className="text-[10px] text-gray-500">
            sets {expandedCount} tokens
          </span>
        </div>
        <p className="text-[11px] text-gray-500">{COMPACT_THEME_HINTS[key]}</p>
        <div className="flex items-center gap-2">
          <Input
            id={`compact-${key}`}
            type="color"
            value={
              value.startsWith('#') && value.length >= 4
                ? value.slice(0, 7)
                : '#000000'
            }
            onChange={(e) => onCompactChange(key, e.target.value)}
            onFocus={() => setActiveKey(key)}
            className="h-9 w-12 rounded border border-gray-300 bg-white p-1"
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onCompactChange(key, e.target.value)}
            onFocus={() => setActiveKey(key)}
            className="flex-1 border-gray-300 bg-white text-gray-900"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-8 pt-2">
      <CartoonThemeSchema
        compact={compact}
        active={activeKey}
        onSelect={(key) => {
          setActiveKey(key);
          document
            .getElementById(`simple-${key}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
      />

      <div className="space-y-3">
        {renderColorField('primaryColor')}
        {renderColorField('destructiveColor')}
        {renderColorField('borderColor')}

        {/* Font */}
        <div
          id="simple-fontFamily"
          className={cn(
            'space-y-2 rounded-lg border p-3 transition',
            activeKey === 'fontFamily'
              ? 'border-amber-300 bg-amber-50/70'
              : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium text-gray-900">
              {COMPACT_THEME_LABELS.fontFamily}
            </Label>
            <span className="text-[10px] text-gray-500">
              sets {getExpandedKeysForCompact('fontFamily').length} tokens
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            {COMPACT_THEME_HINTS.fontFamily}
          </p>
          <Select
            value={fontSelectValue}
            onValueChange={(val) => {
              setActiveKey('fontFamily');
              onCompactChange('fontFamily', val);
            }}
          >
            <SelectTrigger
              className="border-gray-300 bg-white text-gray-900"
              onFocus={() => setActiveKey('fontFamily')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {!FONT_OPTIONS.includes(fontSelectValue) && (
                <SelectItem value={fontSelectValue}>
                  <span style={{ fontFamily: fontSelectValue }}>
                    {fontSelectValue}
                  </span>
                </SelectItem>
              )}
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Corner roundness */}
        <div
          id="simple-borderRadius"
          className={cn(
            'space-y-2 rounded-lg border p-3 transition',
            activeKey === 'borderRadius'
              ? 'border-amber-300 bg-amber-50/70'
              : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium text-gray-900">
              {COMPACT_THEME_LABELS.borderRadius}
            </Label>
            <span className="text-[10px] text-gray-500">
              sets {getExpandedKeysForCompact('borderRadius').length} tokens
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            {COMPACT_THEME_HINTS.borderRadius}
          </p>
          <div className="flex flex-wrap gap-2">
            {RADIUS_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={
                  compact.borderRadius === preset.value ? 'default' : 'outline'
                }
                className="h-8"
                onClick={() => {
                  setActiveKey('borderRadius');
                  onCompactChange('borderRadius', preset.value);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Input
            type="text"
            value={compact.borderRadius}
            onChange={(e) => onCompactChange('borderRadius', e.target.value)}
            onFocus={() => setActiveKey('borderRadius')}
            className="border-gray-300 bg-white text-gray-900"
            placeholder="e.g. 0.375rem"
          />
        </div>

        {/* Button shape */}
        <div
          id="simple-buttonBorderRadius"
          className={cn(
            'space-y-2 rounded-lg border p-3 transition',
            activeKey === 'buttonBorderRadius'
              ? 'border-amber-300 bg-amber-50/70'
              : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium text-gray-900">
              {COMPACT_THEME_LABELS.buttonBorderRadius}
            </Label>
            <span className="text-[10px] text-gray-500">
              sets {getExpandedKeysForCompact('buttonBorderRadius').length}{' '}
              tokens
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            {COMPACT_THEME_HINTS.buttonBorderRadius}
          </p>
          <div className="flex flex-wrap gap-2">
            {BUTTON_RADIUS_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={
                  compact.buttonBorderRadius === preset.value
                    ? 'default'
                    : 'outline'
                }
                className="h-8"
                style={{
                  borderRadius:
                    preset.value === '9999px' ? '9999px' : undefined,
                }}
                onClick={() => {
                  setActiveKey('buttonBorderRadius');
                  onCompactChange('buttonBorderRadius', preset.value);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Input
            type="text"
            value={compact.buttonBorderRadius}
            onChange={(e) =>
              onCompactChange('buttonBorderRadius', e.target.value)
            }
            onFocus={() => setActiveKey('buttonBorderRadius')}
            className="border-gray-300 bg-white text-gray-900"
            placeholder="e.g. 0.375rem"
          />
        </div>
      </div>

      <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
        These {SIMPLE_THEME_KEYS.length} settings match hosted{' '}
        <code className="rounded bg-white px-1">ebDesignTokens</code> (focus
        outline follows brand). Switch to Advanced anytime to tweak individual
        Salt tokens.
      </p>
    </div>
  );
}

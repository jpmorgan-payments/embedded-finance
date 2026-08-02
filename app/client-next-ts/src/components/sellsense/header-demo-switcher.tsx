'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { ClientScenario } from './dashboard-layout';
import {
  getNextScenario,
  getScenarioByKey,
  getScenarioKeyByDisplayName,
  SCENARIO_ORDER,
  type ScenarioKey,
} from './scenarios-config';
import { useThemeStyles } from './theme-utils';
import type { ThemeOption } from './use-sellsense-themes';

type ScenarioListItem = {
  key: ScenarioKey;
  displayName: string;
  shortName: string;
  category: 'onboarding' | 'active';
  description: string;
};

function getOrderedScenarios(): ScenarioListItem[] {
  return SCENARIO_ORDER.map((key) => {
    const config = getScenarioByKey(key);
    return {
      key,
      displayName: config.displayName,
      shortName: config.shortName,
      category: config.category,
      description: config.description,
    };
  });
}

interface HeaderDemoSwitcherProps {
  clientScenario: ClientScenario;
  setClientScenario: (scenario: ClientScenario) => void;
  themeForDisplay: ThemeOption;
}

/** Compact fixed-width scenario switcher for the SellSense header. */
export function HeaderDemoSwitcher({
  clientScenario,
  setClientScenario,
  themeForDisplay,
}: HeaderDemoSwitcherProps) {
  const themeStyles = useThemeStyles(themeForDisplay);
  const [isScenarioMenuOpen, setIsScenarioMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const scenarios = getOrderedScenarios();
  const currentScenarioKey = getScenarioKeyByDisplayName(clientScenario);
  const currentIndex = currentScenarioKey
    ? SCENARIO_ORDER.indexOf(currentScenarioKey)
    : 0;
  const currentMeta = currentScenarioKey
    ? getScenarioByKey(currentScenarioKey)
    : undefined;

  const nextScenario = getScenarioByKey(
    currentScenarioKey ? getNextScenario(currentScenarioKey) : SCENARIO_ORDER[0]
  );
  // Wrap at the ends so prev/next stay usable while scrubbing the full list.
  const prevScenario = getScenarioByKey(
    currentIndex <= 0
      ? SCENARIO_ORDER[SCENARIO_ORDER.length - 1]
      : SCENARIO_ORDER[currentIndex - 1]
  );

  const onboardingScenarios = scenarios.filter(
    (s) => s.category === 'onboarding'
  );
  const activeScenarios = scenarios.filter((s) => s.category === 'active');

  useEffect(() => {
    if (!isScenarioMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsScenarioMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsScenarioMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isScenarioMenuOpen]);

  const selectScenario = (displayName: string) => {
    setClientScenario(displayName as ClientScenario);
    setIsScenarioMenuOpen(false);
  };

  // Fixed center column keeps ◀ / ▶ under the cursor while short names change length.
  const shellClass = `relative grid grid-cols-[1.75rem_14rem_1.75rem] items-center gap-0.5 rounded-full border px-1 py-1 shadow-sm sm:grid-cols-[1.75rem_16rem_1.75rem] ${themeStyles.getHeaderSettingsButtonStyles()}`;
  const textClass = themeStyles.getHeaderTextStyles();
  const mutedClass = themeStyles.getHeaderLabelStyles();
  const iconBtnClass = `h-7 w-7 shrink-0 justify-self-center rounded-full ${themeStyles.getHeaderButtonStyles()}`;

  const renderScenarioGroup = (
    label: string,
    items: ScenarioListItem[]
  ): ReactNode => (
    <div className="py-1.5">
      <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </div>
      <ul className="space-y-0.5 px-1" role="group" aria-label={label}>
        {items.map((item) => {
          const selected = item.displayName === clientScenario;
          return (
            <li key={item.key}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectScenario(item.displayName)}
                className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  selected
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? 'border-white/40 bg-white/15'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium leading-tight">
                    {item.shortName}
                  </span>
                  <span
                    className={`mt-0.5 block truncate text-[11px] leading-snug ${
                      selected ? 'text-white/70' : 'text-slate-500'
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="mx-4 flex max-w-3xl flex-1 items-center justify-center gap-2"
    >
      <span
        className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] ${mutedClass}`}
      >
        Scenario
      </span>
      <div className={shellClass} role="group" aria-label="Scenario switcher">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconBtnClass}
          onClick={() => setClientScenario(prevScenario.displayName)}
          title={`Previous: ${prevScenario.displayName}`}
          aria-label={`Previous scenario: ${prevScenario.displayName}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <button
          type="button"
          className={`flex w-full min-w-0 items-center gap-1.5 rounded-full px-1.5 py-1 text-left transition-colors ${textClass} hover:bg-black/5`}
          onClick={() => setIsScenarioMenuOpen((open) => !open)}
          aria-haspopup="listbox"
          aria-expanded={isScenarioMenuOpen}
          aria-controls={listboxId}
          title={`Scenario: ${clientScenario}`}
        >
          <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight">
            {currentMeta?.shortName ?? clientScenario}
          </span>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${mutedClass} bg-black/5`}
          >
            {currentIndex + 1}/{SCENARIO_ORDER.length}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${mutedClass} ${
              isScenarioMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconBtnClass}
          onClick={() => setClientScenario(nextScenario.displayName)}
          title={`Next: ${nextScenario.displayName}`}
          aria-label={`Next scenario: ${nextScenario.displayName}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {isScenarioMenuOpen ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Demo scenarios"
            className="absolute left-1/2 top-[calc(100%+0.5rem)] z-[60] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="max-h-[min(24rem,70vh)] overflow-y-auto py-1">
              {renderScenarioGroup('Onboarding', onboardingScenarios)}
              <div className="mx-3 border-t border-slate-100" />
              {renderScenarioGroup('Active seller', activeScenarios)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
